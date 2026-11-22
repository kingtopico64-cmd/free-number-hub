import {
  BOT_BUTTONS,
  COUNTRIES,
  MAIN_REPLY_KEYBOARD,
  SMS_SERVICES,
} from './botData.ts';
import {BotAccountStore, validateE164PhoneNumber} from './store.ts';
import type {
  BotAction,
  InlineKeyboardMarkup,
  TelegramUpdate,
} from './types.ts';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCountriesInlineKeyboard(page = 0): InlineKeyboardMarkup {
  const pageSize = 5;
  const start = page * pageSize;
  const slice = COUNTRIES.slice(start, start + pageSize);
  const rows = [];

  for (let i = 0; i < slice.length; i += 2) {
    const pair = slice.slice(i, i + 2).map((country) => ({
      text: `${country.flag} ${country.name} (${country.dialCode})`,
      callback_data: `country:${country.code}`,
    }));
    rows.push(pair);
  }

  const navRow = [];
  if (page > 0) {
    navRow.push({text: '⬅️ Previous', callback_data: `countries_page:${page - 1}`});
  }
  if (start + pageSize < COUNTRIES.length) {
    navRow.push({text: 'Next ➡️', callback_data: `countries_page:${page + 1}`});
  }
  if (navRow.length > 0) {
    rows.push(navRow);
  }

  rows.push([{text: '➕ Register My Own Number', callback_data: 'account:add'}]);

  return {inline_keyboard: rows};
}

function buildWelcomeMessage(firstName: string): string {
  return [
    `👋 <b>Welcome to Free Number Hub, ${escapeHtml(firstName)}!</b>`,
    '',
    'A clean, privacy-first hub to organize and route SMS alerts from <b>phone numbers that you own or are explicitly authorized to use</b>.',
    '',
    '<b>Policy &amp; Privacy Guardrails:</b>',
    '• Only register numbers you legally own or control (personal SIMs, company lines, or your own VoIP/QA accounts).',
    '• We never collect, scrape, or share other people’s private verification codes.',
    '',
    'Tap any button on your mobile keyboard below or use <code>/help</code> to explore commands.',
  ].join('\n');
}

function buildCountriesOverviewText(page = 0): string {
  const pageSize = 5;
  const start = page * pageSize;
  const slice = COUNTRIES.slice(start, start + pageSize);
  const lines = slice.map(
    (c) => `• ${c.flag} <b>${escapeHtml(c.name)}</b> (<code>${c.dialCode}</code>) — ${escapeHtml(c.digitsHint)}`,
  );

  return [
    `🌍 <b>Supported Countries (${start + 1}–${start + slice.length} of ${COUNTRIES.length})</b>`,
    '',
    ...lines,
    '',
    'Tap a country below to view its E.164 format, compatible authorized carriers, and compliance notes.',
  ].join('\n');
}

function buildServicesOverviewText(): string {
  const lines = SMS_SERVICES.map(
    (svc, idx) => `${idx + 1}. <b>${escapeHtml(svc.title)}</b> (${escapeHtml(svc.category)})\n   ${escapeHtml(svc.summary)}`,
  );

  return [
    '📱 <b>Legitimate SMS Services &amp; Use Cases</b>',
    '',
    ...lines,
    '',
    '⚠️ <i>Strictly Authorized Lines Only: Free Number Hub never provides shared public inboxes or third-party OTP interception.</i>',
    '',
    'Select a service below for step-by-step setup instructions:',
  ].join('\n');
}

function buildServicesInlineKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      ...SMS_SERVICES.map((svc) => [
        {text: `📘 ${svc.title}`, callback_data: `service:${svc.id}`},
      ]),
      [{text: '👤 Go to My Account', callback_data: 'account:overview'}],
    ],
  };
}

function buildAccountOverview(store: BotAccountStore, userId: number): {
  text: string;
  replyMarkup: InlineKeyboardMarkup;
} {
  const session = store.getOrCreateSession(userId);
  const numbers = store.listAuthorizedNumbers(userId);

  const listPreview =
    numbers.length === 0
      ? '<i>No authorized numbers registered yet.</i>'
      : numbers
          .map((item) => {
            const country = COUNTRIES.find((c) => c.code === item.countryCode);
            const flag = country ? country.flag : '📞';
            return `• ${flag} <code>${escapeHtml(item.phoneNumber)}</code> — ${escapeHtml(item.label)} (Owner Verified)`;
          })
          .join('\n');

  const text = [
    '👤 <b>My Account</b>',
    '',
    `<b>User:</b> ${escapeHtml(session.firstName)}${session.username ? ` (@${escapeHtml(session.username)})` : ''}`,
    `<b>Telegram User ID:</b> <code>${userId}</code>`,
    `<b>Authorized Numbers:</b> ${numbers.length} / 10`,
    '',
    '<b>Your Registered Own Numbers:</b>',
    listPreview,
    '',
    '<i>Every number stays isolated to your private Telegram User ID and requires ownership attestation.</i>',
  ].join('\n');

  const inlineRows = [
    [
      {text: '➕ Register Own Number', callback_data: 'account:add'},
      {text: '📋 Manage Numbers', callback_data: 'account:list'},
    ],
    [{text: '🔗 Personal Webhook Guide', callback_data: 'account:webhook'}],
  ];

  return {
    text,
    replyMarkup: {inline_keyboard: inlineRows},
  };
}

function buildHelpText(): string {
  return [
    '💬 <b>Free Number Hub — Help &amp; Instructions</b>',
    '',
    '<b>Quick Start (3 Steps):</b>',
    '1. Tap <b>🌍 Countries</b> to check E.164 formatting for your region.',
    '2. Tap <b>👤 My Account</b> or send <code>/addnumber</code> to register a phone number you own or are authorized to manage.',
    '3. Connect your personal VoIP/SIM webhook exclusively to your own private Telegram chat.',
    '',
    '<b>Available Commands:</b>',
    '• <code>/start</code> — Welcome &amp; mobile menu keyboard',
    '• <code>/countries</code> — Browse supported countries &amp; dialing rules',
    '• <code>/services</code> — Legitimate SMS automation &amp; forwarding guides',
    '• <code>/account</code> — View your Telegram ID &amp; authorized numbers',
    '• <code>/addnumber</code> — Guided setup to register your own number',
    '• <code>/help</code> — Show this help guide',
    '• <code>/about</code> — Mission, privacy, and ownership policy',
    '',
    '<b>Privacy Guarantee:</b>',
    'We never ask for your Telegram password, never share numbers across users, and never collect third-party verification codes.',
  ].join('\n');
}

function buildAboutText(): string {
  return [
    'ℹ️ <b>About Free Number Hub</b>',
    '',
    'Free Number Hub is a developer-friendly, privacy-first Telegram bot built to help individuals, QA engineers, and support teams manage <b>their own authorized phone numbers</b> cleanly on mobile.',
    '',
    '<b>Core Principles:</b>',
    '• <b>Ownership First:</b> Only numbers owned or formally authorized by you may be registered.',
    '• <b>Zero Shared Codes:</b> Private OTPs and verification texts are never pooled, scraped, or exposed.',
    '• <b>Secure Token Storage:</b> Your Telegram bot token lives strictly on the server via environment variables.',
    '• <b>Portable Architecture:</b> Runs cleanly on Node.js 22+ with free or low-cost hosting (Render, Railway, Fly.io, Koyeb).',
  ].join('\n');
}

export function handleBotUpdate(
  update: TelegramUpdate,
  store: BotAccountStore,
): BotAction[] {
  if (update.callback_query) {
    return handleCallbackQuery(update, store);
  }

  const message = update.message;
  if (!message || !message.text) {
    return [];
  }

  const chatId = message.chat.id;
  const userId = message.from?.id ?? chatId;
  const firstName = message.from?.first_name ?? message.chat.first_name ?? 'there';
  const username = message.from?.username ?? message.chat.username;
  const text = message.text.trim();

  const session = store.getOrCreateSession(userId, firstName, username);

  // Allow slash commands or main menu buttons to interrupt an active registration flow cleanly.
  const isGlobalMenuTrigger =
    text.startsWith('/') ||
    text === BOT_BUTTONS.COUNTRIES ||
    text === BOT_BUTTONS.SMS_SERVICES ||
    text === BOT_BUTTONS.MY_ACCOUNT ||
    text === BOT_BUTTONS.HELP ||
    text === BOT_BUTTONS.ABOUT_US;

  if (isGlobalMenuTrigger && session.registrationStep !== 'idle') {
    store.setRegistrationState(userId, 'idle');
  }

  if (!isGlobalMenuTrigger && session.registrationStep !== 'idle') {
    return handleRegistrationStepInput(chatId, userId, text, store);
  }

  const normalizedCommand = text.split(/\s+/)[0].split('@')[0].toLowerCase();

  if (normalizedCommand === '/start') {
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: buildWelcomeMessage(firstName),
          parse_mode: 'HTML',
          reply_markup: MAIN_REPLY_KEYBOARD,
        },
      },
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: 'Choose a quick action to get started:',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {text: '🌍 Explore Countries', callback_data: 'countries_page:0'},
                {text: '➕ Register My Number', callback_data: 'account:add'},
              ],
              [{text: '📱 Legitimate SMS Guide', callback_data: 'services:overview'}],
            ],
          },
        },
      },
    ];
  }

  if (normalizedCommand === '/countries' || text === BOT_BUTTONS.COUNTRIES) {
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: buildCountriesOverviewText(0),
          parse_mode: 'HTML',
          reply_markup: buildCountriesInlineKeyboard(0),
        },
      },
    ];
  }

  if (normalizedCommand === '/services' || text === BOT_BUTTONS.SMS_SERVICES) {
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: buildServicesOverviewText(),
          parse_mode: 'HTML',
          reply_markup: buildServicesInlineKeyboard(),
        },
      },
    ];
  }

  if (normalizedCommand === '/account' || text === BOT_BUTTONS.MY_ACCOUNT) {
    const account = buildAccountOverview(store, userId);
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: account.text,
          parse_mode: 'HTML',
          reply_markup: account.replyMarkup,
        },
      },
    ];
  }

  if (normalizedCommand === '/addnumber') {
    return [startAddNumberPrompt(chatId, store, userId)];
  }

  if (normalizedCommand === '/help' || text === BOT_BUTTONS.HELP) {
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: buildHelpText(),
          parse_mode: 'HTML',
          reply_markup: MAIN_REPLY_KEYBOARD,
        },
      },
    ];
  }

  if (normalizedCommand === '/about' || text === BOT_BUTTONS.ABOUT_US) {
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: buildAboutText(),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {text: '📱 SMS Services', callback_data: 'services:overview'},
                {text: '👤 My Account', callback_data: 'account:overview'},
              ],
            ],
          },
        },
      },
    ];
  }

  if (normalizedCommand === '/cancel') {
    store.setRegistrationState(userId, 'idle');
    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: 'Action cancelled. Select any option from the keyboard below.',
          parse_mode: 'HTML',
          reply_markup: MAIN_REPLY_KEYBOARD,
        },
      },
    ];
  }

  return [
    {
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          `I didn’t recognize <code>${escapeHtml(text)}</code>.`,
          '',
          'Please use one of the 5 menu buttons below or send <code>/help</code> to see all commands.',
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: MAIN_REPLY_KEYBOARD,
      },
    },
  ];
}

function startAddNumberPrompt(chatId: number, store: BotAccountStore, userId: number): BotAction {
  store.setRegistrationState(userId, 'idle');
  const rows = [];
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    rows.push(
      COUNTRIES.slice(i, i + 2).map((c) => ({
        text: `${c.flag} ${c.name} (${c.dialCode})`,
        callback_data: `add_country:${c.code}`,
      })),
    );
  }
  rows.push([{text: 'Cancel', callback_data: 'account:overview'}]);

  return {
    type: 'sendMessage',
    payload: {
      chat_id: chatId,
      text: [
        '➕ <b>Register Your Own Authorized Number</b>',
        '',
        'Only add a number that <b>you personally own</b> or have explicit written authorization to operate.',
        '',
        'Step 1 of 3: Select the country of your number:',
      ].join('\n'),
      parse_mode: 'HTML',
      reply_markup: {inline_keyboard: rows},
    },
  };
}

function handleRegistrationStepInput(
  chatId: number,
  userId: number,
  text: string,
  store: BotAccountStore,
): BotAction[] {
  const session = store.getOrCreateSession(userId);

  if (session.registrationStep === 'awaiting_number') {
    const check = validateE164PhoneNumber(text, session.pendingCountryCode);
    if (!check.valid) {
      return [
        {
          type: 'sendMessage',
          payload: {
            chat_id: chatId,
            text: `⚠️ ${escapeHtml(check.reason ?? 'Invalid number format.')}\n\nSend /cancel to exit.`,
            parse_mode: 'HTML',
          },
        },
      ];
    }

    store.setRegistrationState(userId, 'awaiting_label', {
      pendingPhoneNumber: check.normalized,
    });

    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: [
            `✅ Format verified: <code>${escapeHtml(check.normalized)}</code>`,
            '',
            'Step 2 of 3: Reply with a short label for your number (for example: <code>Personal Travel SIM</code> or <code>Staging QA Line</code>).',
          ].join('\n'),
          parse_mode: 'HTML',
        },
      },
    ];
  }

  if (session.registrationStep === 'awaiting_label') {
    const cleanLabel = text.trim().slice(0, 40) || 'My Authorized Line';
    store.setRegistrationState(userId, 'awaiting_attestation', {
      pendingLabel: cleanLabel,
    });

    return [
      {
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: [
            '🛡️ <b>Step 3 of 3: Ownership Attestation</b>',
            '',
            `<b>Number:</b> <code>${escapeHtml(session.pendingPhoneNumber ?? '')}</code>`,
            `<b>Label:</b> ${escapeHtml(cleanLabel)}`,
            '',
            'Confirm that you own or are explicitly authorized to manage this number, and that you will not use it to collect or share other people’s private verification codes.',
          ].join('\n'),
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '✅ I Confirm Ownership & Save',
                  callback_data: 'add_confirm:yes',
                },
              ],
              [{text: '❌ Cancel Registration', callback_data: 'add_confirm:no'}],
            ],
          },
        },
      },
    ];
  }

  return [
    {
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: 'Please tap the confirmation button above or send /cancel to start over.',
        parse_mode: 'HTML',
      },
    },
  ];
}

function handleCallbackQuery(
  update: TelegramUpdate,
  store: BotAccountStore,
): BotAction[] {
  const query = update.callback_query;
  if (!query || !query.data) {
    return [];
  }

  const userId = query.from.id;
  const chatId = query.message?.chat.id ?? userId;
  const firstName = query.from.first_name ?? 'User';
  store.getOrCreateSession(userId, firstName, query.from.username);

  const data = query.data;
  const actions: BotAction[] = [
    {
      type: 'answerCallbackQuery',
      payload: {callback_query_id: query.id},
    },
  ];

  if (data.startsWith('countries_page:')) {
    const page = Number.parseInt(data.split(':')[1] ?? '0', 10) || 0;
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildCountriesOverviewText(page),
        parse_mode: 'HTML',
        reply_markup: buildCountriesInlineKeyboard(page),
      },
    });
    return actions;
  }

  if (data.startsWith('country:')) {
    const code = data.split(':')[1];
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) {
      return actions;
    }

    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          `${country.flag} <b>${escapeHtml(country.name)} (${escapeHtml(country.dialCode)})</b>`,
          '',
          `<b>Region:</b> ${escapeHtml(country.region)}`,
          `<b>E.164 Example:</b> <code>${escapeHtml(country.e164Example)}</code>`,
          `<b>Format Rule:</b> ${escapeHtml(country.digitsHint)}`,
          `<b>Compatible Providers:</b> ${escapeHtml(country.authorizedProviders.join(', '))}`,
          '',
          `<b>Compliance Note:</b> ${escapeHtml(country.complianceNote)}`,
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `➕ Register My ${country.code} Number`,
                callback_data: `add_country:${country.code}`,
              },
            ],
            [{text: '⬅️ Back to Countries', callback_data: 'countries_page:0'}],
          ],
        },
      },
    });
    return actions;
  }

  if (data === 'services:overview') {
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildServicesOverviewText(),
        parse_mode: 'HTML',
        reply_markup: buildServicesInlineKeyboard(),
      },
    });
    return actions;
  }

  if (data.startsWith('service:')) {
    const id = data.split(':')[1];
    const svc = SMS_SERVICES.find((s) => s.id === id);
    if (!svc) {
      return actions;
    }

    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          `📱 <b>${escapeHtml(svc.title)}</b>`,
          `<i>Category: ${escapeHtml(svc.category)}</i>`,
          '',
          `<b>Legitimate Use:</b> ${escapeHtml(svc.legitimateUse)}`,
          '',
          '<b>Setup Steps:</b>',
          ...svc.setupSteps.map((step, i) => `${i + 1}. ${escapeHtml(step)}`),
          '',
          `🛡️ <b>Privacy Rule:</b> ${escapeHtml(svc.privacyRule)}`,
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: '➕ Register My Number', callback_data: 'account:add'}],
            [{text: '⬅️ All SMS Services', callback_data: 'services:overview'}],
          ],
        },
      },
    });
    return actions;
  }

  if (data === 'account:overview') {
    const account = buildAccountOverview(store, userId);
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: account.text,
        parse_mode: 'HTML',
        reply_markup: account.replyMarkup,
      },
    });
    return actions;
  }

  if (data === 'account:add') {
    actions.push(startAddNumberPrompt(chatId, store, userId));
    return actions;
  }

  if (data.startsWith('add_country:')) {
    const code = data.split(':')[1];
    const country = COUNTRIES.find((c) => c.code === code);
    if (!country) {
      return actions;
    }

    store.setRegistrationState(userId, 'awaiting_number', {
      pendingCountryCode: country.code,
      pendingPhoneNumber: undefined,
      pendingLabel: undefined,
    });

    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          `${country.flag} <b>Selected: ${escapeHtml(country.name)} (${escapeHtml(country.dialCode)})</b>`,
          '',
          `Please reply with <b>your own</b> phone number in international E.164 format (example: <code>${escapeHtml(country.e164Example)}</code>).`,
          '',
          'Send <code>/cancel</code> anytime to abort.',
        ].join('\n'),
        parse_mode: 'HTML',
      },
    });
    return actions;
  }

  if (data === 'add_confirm:yes') {
    const session = store.getOrCreateSession(userId);
    if (
      session.registrationStep !== 'awaiting_attestation' ||
      !session.pendingCountryCode ||
      !session.pendingPhoneNumber
    ) {
      actions.push({
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: 'No pending number registration found. Tap <b>👤 My Account</b> to start again.',
          parse_mode: 'HTML',
        },
      });
      return actions;
    }

    const result = store.addAuthorizedNumber(
      userId,
      session.pendingCountryCode,
      session.pendingPhoneNumber,
      session.pendingLabel ?? 'My Authorized Line',
      true,
    );

    if (!result.ok) {
      actions.push({
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: `⚠️ ${escapeHtml(result.error)}`,
          parse_mode: 'HTML',
        },
      });
      return actions;
    }

    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          '✅ <b>Authorized Number Saved</b>',
          '',
          `<b>Number:</b> <code>${escapeHtml(result.record.phoneNumber)}</code>`,
          `<b>Label:</b> ${escapeHtml(result.record.label)}`,
          `<b>Owner ID:</b> <code>${userId}</code>`,
          '',
          'This number is now listed exclusively under your account.',
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{text: '👤 View My Account', callback_data: 'account:overview'}]],
        },
      },
    });
    return actions;
  }

  if (data === 'add_confirm:no') {
    store.setRegistrationState(userId, 'idle');
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: 'Registration cancelled. No phone number was saved.',
        parse_mode: 'HTML',
        reply_markup: MAIN_REPLY_KEYBOARD,
      },
    });
    return actions;
  }

  if (data === 'account:list') {
    const numbers = store.listAuthorizedNumbers(userId);
    if (numbers.length === 0) {
      actions.push({
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: '📋 You have no authorized numbers saved yet. Tap below to register a number you own.',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[{text: '➕ Register Own Number', callback_data: 'account:add'}]],
          },
        },
      });
      return actions;
    }

    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: '📋 <b>Manage Your Authorized Numbers</b>\n\nTap any number below to remove it from your account:',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...numbers.map((item) => [
              {
                text: `🗑️ Remove ${item.phoneNumber} (${item.label})`,
                callback_data: `account:delete:${item.id}`,
              },
            ]),
            [{text: '⬅️ Back to My Account', callback_data: 'account:overview'}],
          ],
        },
      },
    });
    return actions;
  }

  if (data.startsWith('account:delete:')) {
    const id = data.split(':')[2] ?? '';
    const removed = store.removeAuthorizedNumber(userId, id);
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: removed
          ? '🗑️ Number removed from your account.'
          : 'Number was not found or already removed.',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{text: '👤 Back to My Account', callback_data: 'account:overview'}]],
        },
      },
    });
    return actions;
  }

  if (data === 'account:webhook') {
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          '🔗 <b>Personal Webhook Integration</b>',
          '',
          'To receive SMS notifications from your <b>own</b> carrier or VoIP provider (such as Twilio, Telnyx, or Vonage) inside this private chat:',
          '',
          `1. Use your private Telegram Chat ID: <code>${userId}</code>`,
          '2. Configure your SMS provider webhook to forward only messages addressed to your verified number.',
          '3. Never expose your <code>TELEGRAM_BOT_TOKEN</code> in client apps or public repositories.',
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{text: '⬅️ Back to My Account', callback_data: 'account:overview'}]],
        },
      },
    });
    return actions;
  }

  return actions;
}
