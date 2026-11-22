import type {
  BotAction,
  BotCommand,
  TelegramUpdate,
  TelegramUser,
} from './types.ts';

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export class TelegramApiClient {
  private readonly baseUrl: string;

  constructor(token: string) {
    const cleanToken = token.trim();
    if (!cleanToken) {
      throw new Error('TELEGRAM_BOT_TOKEN must be a non-empty string.');
    }
    this.baseUrl = `https://api.telegram.org/bot${cleanToken}`;
  }

  private async call<T>(
    method: string,
    body?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: body ? 'POST' : 'GET',
      headers: body ? {'Content-Type': 'application/json'} : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    const data = (await response.json()) as TelegramApiResponse<T>;
    if (!response.ok || !data.ok || data.result === undefined) {
      const reason = data.description ?? `HTTP ${response.status}`;
      throw new Error(`Telegram API ${method} failed: ${reason}`);
    }
    return data.result;
  }

  getMe(): Promise<TelegramUser> {
    return this.call<TelegramUser>('getMe');
  }

  setMyCommands(commands: BotCommand[]): Promise<boolean> {
    return this.call<boolean>('setMyCommands', {commands});
  }

  setWebhook(url: string, secretToken?: string): Promise<boolean> {
    const body: Record<string, unknown> = {
      url,
      allowed_updates: ['message', 'callback_query'],
    };
    if (secretToken) {
      body.secret_token = secretToken;
    }
    return this.call<boolean>('setWebhook', body);
  }

  deleteWebhook(dropPendingUpdates = false): Promise<boolean> {
    return this.call<boolean>('deleteWebhook', {
      drop_pending_updates: dropPendingUpdates,
    });
  }

  getUpdates(offset: number, timeoutSeconds = 25, signal?: AbortSignal): Promise<TelegramUpdate[]> {
    return this.call<TelegramUpdate[]>(
      'getUpdates',
      {
        offset,
        timeout: timeoutSeconds,
        allowed_updates: ['message', 'callback_query'],
      },
      signal,
    );
  }

  async executeActions(actions: BotAction[]): Promise<void> {
    for (const action of actions) {
      if (action.type === 'sendMessage') {
        await this.call('sendMessage', action.payload as unknown as Record<string, unknown>);
      } else if (action.type === 'editMessageText') {
        await this.call('editMessageText', action.payload as unknown as Record<string, unknown>);
      } else if (action.type === 'answerCallbackQuery') {
        await this.call(
          'answerCallbackQuery',
          action.payload as unknown as Record<string, unknown>,
        );
      }
    }
  }
}
