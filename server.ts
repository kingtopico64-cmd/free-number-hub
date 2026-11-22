
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import dotenv from 'dotenv';
import express from 'express';

import {
  BOT_BUTTONS,
  BOT_COMMANDS,
  COUNTRIES,
  DEPLOYMENT_GUIDES,
  SMS_SERVICES,
} from './botData.ts';

import {handleBotUpdate} from './freeNumberHubBot.ts';
import {BotAccountStore} from './store.ts';
import {TelegramApiClient} from './telegramApi.ts';
import type {TelegramUpdate} from './types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const liveStore = new BotAccountStore();
const simulatorStore = new BotAccountStore();

interface BotRuntimeStatus {
  botConfigured: boolean;
  botUsername: string | null;
  mode: 'polling' | 'webhook' | 'standby';
  commandsCount: number;
  lastError: string | null;
}

const runtimeStatus: BotRuntimeStatus = {
  botConfigured: false,
  botUsername: null,
  mode: 'standby',
  commandsCount: BOT_COMMANDS.length,
  lastError: null,
};

let telegramClient: TelegramApiClient | null = null;
let activeWebhookSecret: string | null = null;
let pollingAbortController: AbortController | null = null;
let isShuttingDown = false;
let simulatorSequence = 1000;

function deriveSimulatorUserId(sessionId: unknown): number {
  if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return 10042001;
  }

  const digest = crypto
    .createHash('sha256')
    .update(sessionId.trim().slice(0, 64))
    .digest();

  return 10000000 + (digest.readUInt32BE(0) % 89000000);
}

function timingSafeSecretMatch(
  provided: string | undefined,
  expected: string | null,
): boolean {
  if (!provided || !expected) {
    return false;
  }

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function sanitizeTelegramError(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : 'Unknown Telegram API error';

  return raw.replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<REDACTED>');
}

async function startPollingLoop(client: TelegramApiClient): Promise<void> {
  let offset = 0;
  pollingAbortController = new AbortController();

  while (
    !isShuttingDown &&
    pollingAbortController &&
    !pollingAbortController.signal.aborted
  ) {
    try {
      const updates = await client.getUpdates(
        offset,
        25,
        pollingAbortController.signal,
      );

      for (const update of updates) {
        offset = Math.max(offset, update.update_id + 1);

        const actions = handleBotUpdate(update, liveStore);
        await client.executeActions(actions);
      }

      runtimeStatus.lastError = null;
    } catch (error) {
      if (
        isShuttingDown ||
        pollingAbortController?.signal.aborted
      ) {
        break;
      }

      const message = sanitizeTelegramError(error);
      runtimeStatus.lastError = message;

      console.error('[FreeNumberHub] Polling error:', message);

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function initializeTelegramBot(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!token) {
    runtimeStatus.botConfigured = false;
    runtimeStatus.mode = 'standby';

    console.log(
      '[FreeNumberHub] TELEGRAM_BOT_TOKEN is not set. Running in standby + interactive simulator mode.',
    );

    return;
  }

  try {
    const client = new TelegramApiClient(token);
    const me = await client.getMe();

    await client.setMyCommands(BOT_COMMANDS);

    telegramClient = client;
    runtimeStatus.botConfigured = true;
    runtimeStatus.botUsername = me.username ?? me.first_name;
    runtimeStatus.lastError = null;

    const requestedMode = process.env.TELEGRAM_MODE
      ?.trim()
      .toLowerCase();

    const appUrl =
      process.env.APP_URL?.trim() ||
      process.env.RENDER_EXTERNAL_URL?.trim();

    if (
      requestedMode === 'webhook' &&
      appUrl &&
      appUrl.startsWith('https://')
    ) {
      const configuredSecret =
        process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

      activeWebhookSecret =
        configuredSecret || crypto.randomBytes(24).toString('hex');

      const webhookUrl =
        `${appUrl.replace(/\/+$/, '')}/api/telegram/webhook`;

      await client.setWebhook(webhookUrl, activeWebhookSecret);

      runtimeStatus.mode = 'webhook';

      console.log(
        `[FreeNumberHub] Bot @${runtimeStatus.botUsername} active in webhook mode.`,
      );
    } else {
      await client.deleteWebhook(false);

      runtimeStatus.mode = 'polling';

      console.log(
        `[FreeNumberHub] Bot @${runtimeStatus.botUsername} active in long-polling mode.`,
      );

      void startPollingLoop(client);
    }
  } catch (error) {
    const safeMessage = sanitizeTelegramError(error);

    runtimeStatus.botConfigured = false;
    runtimeStatus.mode = 'standby';
    runtimeStatus.lastError = safeMessage;

    console.error(
      '[FreeNumberHub] Telegram initialization failed:',
      safeMessage,
    );
  }
}

const SOURCE_ALLOWLIST: Record<string, string> = {
  'server.ts': 'server.ts',
  'freeNumberHubBot.ts': 'freeNumberHubBot.ts',
  'botData.ts': 'botData.ts',
  'telegramApi.ts': 'telegramApi.ts',
  'store.ts': 'store.ts',
  'types.ts': 'types.ts',
  '.env.example': '.env.example',
};

async function startServer(): Promise<void> {
  const app = express();

  app.use(express.json({limit: '1mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      ...runtimeStatus,
    });
  });

  app.get('/api/bot-catalog', (_req, res) => {
    res.json({
      buttons: BOT_BUTTONS,
      commands: BOT_COMMANDS,
      countries: COUNTRIES,
      services: SMS_SERVICES,
      deploymentGuides: DEPLOYMENT_GUIDES,
    });
  });

  app.get('/api/source-file', async (req, res) => {
    const requested =
      typeof req.query.name === 'string' ? req.query.name : '';

    const mapped = SOURCE_ALLOWLIST[requested];

    if (!mapped) {
      res.status(400).json({
        error: 'Invalid or unsupported source file name.',
      });
      return;
    }

    const resolvedPath = path.resolve(__dirname, mapped);

    if (!resolvedPath.startsWith(__dirname + path.sep)) {
      res.status(403).json({error: 'Access denied.'});
      return;
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf8');

      res.json({
        name: mapped,
        content,
      });
    } catch {
      res.status(404).json({error: 'Source file not found.'});
    }
  });

  app.post('/api/telegram/webhook', async (req, res) => {
    if (!telegramClient || runtimeStatus.mode !== 'webhook') {
      res.status(503).json({
        ok: false,
        error: 'Webhook mode is not active.',
      });
      return;
    }

    const secretHeader = req.header(
      'X-Telegram-Bot-Api-Secret-Token',
    );

    if (!timingSafeSecretMatch(secretHeader, activeWebhookSecret)) {
      res.status(401).json({
        ok: false,
        error: 'Unauthorized webhook request.',
      });
      return;
    }

    const update = req.body as TelegramUpdate | undefined;

    if (!update || typeof update.update_id !== 'number') {
      res.status(400).json({
        ok: false,
        error: 'Malformed Telegram update payload.',
      });
      return;
    }

    try {
      const actions = handleBotUpdate(update, liveStore);

      await telegramClient.executeActions(actions);

      res.json({ok: true});
    } catch (error) {
      console.error(
        '[FreeNumberHub] Webhook execution error:',
        sanitizeTelegramError(error),
      );

      res.status(500).json({
        ok: false,
        error: 'Failed to process Telegram update.',
      });
    }
  });

  app.post('/api/simulator/update', (req, res) => {
    const body = req.body as {
      sessionId?: unknown;
      text?: unknown;
      callbackData?: unknown;
      firstName?: unknown;
    };

    const userId = deriveSimulatorUserId(body?.sessionId);

    const firstName =
      typeof body?.firstName === 'string' && body.firstName.trim()
        ? body.firstName.trim().slice(0, 32)
        : 'Alex';

    simulatorSequence += 1;

    let update: TelegramUpdate;

    if (
      typeof body?.callbackData === 'string' &&
      body.callbackData.trim()
    ) {
      update = {
        update_id: simulatorSequence,
        callback_query: {
          id: `sim_cb_${simulatorSequence}`,
          from: {
            id: userId,
            first_name: firstName,
            username: 'demo_owner',
          },
          message: {
            message_id: simulatorSequence - 1,
            chat: {
              id: userId,
              type: 'private',
              first_name: firstName,
            },
            date: Math.floor(Date.now() / 1000),
          },
          data: body.callbackData.trim().slice(0, 128),
        },
      };
    } else if (
      typeof body?.text === 'string' &&
      body.text.trim()
    ) {
      update = {
        update_id: simulatorSequence,
        message: {
          message_id: simulatorSequence,
          from: {
            id: userId,
            first_name: firstName,
            username: 'demo_owner',
          },
          chat: {
            id: userId,
            type: 'private',
            first_name: firstName,
          },
          date: Math.floor(Date.now() / 1000),
          text: body.text.trim().slice(0, 512),
        },
      };
    } else {
      res.status(400).json({
        error: 'Provide either text or callbackData.',
      });
      return;
    }

    const actions = handleBotUpdate(update, simulatorStore);
    const numbers = simulatorStore.listAuthorizedNumbers(userId);

    res.json({
      update,
      actions,
      userId,
      authorizedNumbersCount: numbers.length,
    });
  });

  app.post('/api/simulator/reset', (req, res) => {
    const body = req.body as {sessionId?: unknown};

    const userId = deriveSimulatorUserId(body?.sessionId);

    simulatorStore.resetUserSession(userId);

    res.json({ok: true});
  });

  if (!IS_PRODUCTION) {
    const {createServer: createViteServer} = await import('vite');

    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');

    app.use(express.static(distDir));

    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[FreeNumberHub] Server listening on http://localhost:${PORT}`,
    );

    void initializeTelegramBot();
  });

  const shutdown = () => {
    isShuttingDown = true;

    pollingAbortController?.abort();

    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

void startServer();
