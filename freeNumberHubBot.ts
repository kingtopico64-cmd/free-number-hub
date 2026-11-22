
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
    rows.push(
      slice.slice(i, i + 2).map((country) => ({
        text: `${country.flag} ${country.name} (${country.dialCode})`,
        callback_data: `country:${country.code}`,
      })),
    );
  }

  const navRow = [];
  if (page > 0) {
    navRow.push({text: '⬅️ Previous', callback_data: `countries_page:${page - 1}`});
  }
  if (start + pageSize < COUNTRIES.length) {
    navRow.push({text: 'Next ➡️', callback_data: `countries_page:${page + 1}`});
  }
  if (navRow.length > 0) rows.push(navRow);

  rows.push([{text: '➕ Register My Own Number', callback_data: 'account:add'}]);

  return {inline_keyboard: rows};
}

function buildWelcomeMessage(firstName: string): string {
  return [
    `👋 <b>Welcome to Free Number Hub, ${escapeHtml(firstName)}!</b>`,
    '',
    'A privacy-first hub for organizing SMS alerts from phone numbers you own or are authorized to manage.',
    '',
    '<b>Privacy rules:</b>',
    '• Only register numbers you own or are authorized to manage.',
    '• Never use this bot to collect or share other people’s private verification codes.',
    '',
    'Tap a menu button below or send <code>/help</code>.',
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
    'Tap a country to view its number format and authorized provider information.',
  ].join('\n');
}

function buildServicesOverviewText(): string {
  const lines = SMS_SERVICES.map(
    (svc, idx) => `${idx + 1}. <b>${escapeHtml(svc.title)}</b> (${escapeHtml(svc.category)})\n   ${escapeHtml(svc.summary)}`,
  );

  return [
    '📱 <b>Legitimate SMS Services</b>',
    '',
    ...lines,
    '',
    '⚠️ Only use numbers you own or are authorized to manage.',
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
  const demoCount = store.listDemoSms(userId).length;

  const listPreview =
    numbers.length === 0
      ? '<i>No authorized numbers registered yet.</i>'
      : numbers.map((item) => {
          const country = COUNTRIES.find((c) => c.code === item.countryCode);
          const flag = country ? country.flag : '📞';
          return `• ${flag} <code>${escapeHtml(item.phoneNumber)}</code> — ${escapeHtml(item.label)}`;
        }).join('\n');

  const text = [
    '👤 <b>My Account</b>',
    '',
    `<b>User:</b> ${escapeHtml(session.firstName)}${session.username ? ` (@${escapeHtml(session.username)})` : ''}`,
    `<b>Telegram User ID:</b> <code>${userId}</code>`,
    `<b>Authorized Numbers:</b> ${numbers.length} / 10`,
    `<b>Saved Demo Messages:</b> ${demoCount}`,
    '',
    '<b>Your Registered Numbers:</b>',
    listPreview,
    '',
    '<i>Ownership is based on your attestation; it is not independently verified.</i>',
  ].join('\n');

  return {
    text,
    replyMarkup: {
      inline_keyboard: [
        [
          {text: '➕ Register Own Number', callback_data: 'account:add'},
          {text: '📋 Manage Numbers', callback_data: 'account:list'},
        ],
        [{text: '📥 Demo SMS Inbox', callback_data: 'sms:demo'}],
        [{text: '🗑️ Clear Demo History', callback_data: 'sms:clear'}],
      ],
    },
  };
}

function buildHelpText(): string {
  return [
    '💬 <b>Free Number Hub — Help</b>',
    '',
    '<b>Commands:</b>',
    '• <code>/start</code> — Open the bot',
    '• <code>/countries</code> — Browse countries',
    '• <code>/services</code> — View SMS services',
    '• <code>/account</code> — View your account',
    '• <code>/addnumber</code> — Register your own number',
    '• <code>/demo</code> — View sample SMS messages',
    '• <code>/inbox</code> — Open demo history',
    '• <code>/help</code> — Show this help',
    '• <code>/about</code> — About this bot',
    '• <code>/cancel</code> — Cancel registration',
    '',
    '<b>Important:</b> Demo messages are examples only. Real SMS delivery requires an authorized SMS source.',
  ].join('\n');
}

function buildAboutText(): string {
  return [
    'ℹ️ <b>About Free Number Hub</b>',
    '',
    'A privacy-first Telegram bot for organizing your own authorized phone numbers and SMS notification tests.',
    '',
    '• Numbers are registered under individual Telegram accounts.',
    '• Demo SMS messages are simulated.',
    '• Real SMS delivery requires an authorized provider or phone connection.',
    '• Never share your Telegram bot token.',
  ].join('\n');
}

function buildDemoSmsMessage(
  store: BotAccountStore,
  userId: number,
): string {
  let messages = store.listDemoSms(userId);

  if (messages.length === 0) {
    store.addDemoSms(
      userId,
      'Demo Service',
      'Your sample notification has been received successfully.',
    );

    store.addDemoSms(
      userId,
      'Test Alert',
      'This is a test notification for your Free Number Hub inbox.',
    );

    messages = store.listDemoSms(userId);
  }

  return [
    '📥 <b>Demo SMS Inbox</b>',
    '',
    '<i>These are simulated messages, not real received SMS.</i>',
    '',
    ...messages.flatMap((item, index) => [
      '━━━━━━━━━━━━━━',
      `📩 <b>Message ${messages.length - index}</b>`,
      `<b>Sender:</b> ${escapeHtml(item.sender)}`,
      `<b>Message:</b> ${escapeHtml(item.message)}`,
      `<b>Received:</b> ${escapeHtml(item.receivedAt)}`,
      '<b>Status:</b> Demo only',
      '',
    ]),
    '━━━━━━━━━━━━━━',
    `✅ Total saved demo messages: ${messages.length}`,
    '',
    'Real SMS messages are not connected yet.',
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
  if (!message || !message.text) return [];

  const chatId = message.chat.id;
  const userId = message.from?.id ?? chatId;
  const firstName = message.from?.first_name ?? message.chat.first_name ?? 'there';
  const username = message.from?.username ?? message.chat.username;
  const text = message.text.trim();

  const session = store.getOrCreateSession(userId, firstName, username);

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

  const command = text.split(/\s+/)[0].split('@')[0].toLowerCase();

  if (command === '/start') {
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
          text: 'Choose an action:',
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {text: '🌍 Explore Countries', callback_data: 'countries_page:0'},
                {text: '➕ Register My Number', callback_data: 'account:add'},
              ],
              [{text: '📥 Demo SMS Inbox', callback_data: 'sms:demo'}],
            ],
          },
        },
      },
    ];
  }

  if (command === '/demo' || command === '/inbox') {
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildDemoSmsMessage(store, userId),
        parse_mode: 'HTML',
      },
    }];
  }

  if (command === '/countries' || text === BOT_BUTTONS.COUNTRIES) {
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildCountriesOverviewText(0),
        parse_mode: 'HTML',
        reply_markup: buildCountriesInlineKeyboard(0),
      },
    }];
  }

  if (command === '/services' || text === BOT_BUTTONS.SMS_SERVICES) {
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildServicesOverviewText(),
        parse_mode: 'HTML',
        reply_markup: buildServicesInlineKeyboard(),
      },
    }];
  }

  if (command === '/account' || text === BOT_BUTTONS.MY_ACCOUNT) {
    const account = buildAccountOverview(store, userId);
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: account.text,
        parse_mode: 'HTML',
        reply_markup: account.replyMarkup,
      },
    }];
  }

  if (command === '/addnumber') {
    return [startAddNumberPrompt(chatId, store, userId)];
  }

  if (command === '/help' || text === BOT_BUTTONS.HELP) {
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildHelpText(),
        parse_mode: 'HTML',
        reply_markup: MAIN_REPLY_KEYBOARD,
      },
    }];
  }

  if (command === '/about' || text === BOT_BUTTONS.ABOUT_US) {
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildAboutText(),
        parse_mode: 'HTML',
        reply_markup: MAIN_REPLY_KEYBOARD,
      },
    }];
  }

  if (command === '/cancel') {
    store.setRegistrationState(userId, 'idle');
    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: 'Action cancelled.',
        parse_mode: 'HTML',
        reply_markup: MAIN_REPLY_KEYBOARD,
      },
    }];
  }

  return [{
    type: 'sendMessage',
    payload: {
      chat_id: chatId,
      text: [
        `I didn’t recognize <code>${escapeHtml(text)}</code>.`,
        '',
        'Use the menu buttons or send <code>/help</code>.',
      ].join('\n'),
      parse_mode: 'HTML',
      reply_markup: MAIN_REPLY_KEYBOARD,
    },
  }];
}

function startAddNumberPrompt(
  chatId: number,
  store: BotAccountStore,
  userId: number,
): BotAction {
  store.setRegistrationState(userId, 'idle');
  const rows = [];

  for (let i = 0; i < COUNTRIES.length; i += 2) {
    rows.push(COUNTRIES.slice(i, i + 2).map((c) => ({
      text: `${c.flag} ${c.name} (${c.dialCode})`,
      callback_data: `add_country:${c.code}`,
    })));
  }

  rows.push([{text: 'Cancel', callback_data: 'account:overview'}]);

  return {
    type: 'sendMessage',
    payload: {
      chat_id: chatId,
      text: [
        '➕ <b>Register Your Own Authorized Number</b>',
        '',
        'Only add a number you own or are explicitly authorized to manage.',
        '',
        'Step 1 of 3: Select its country:',
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
      return [{
        type: 'sendMessage',
        payload: {
          chat_id: chatId,
          text: `⚠️ ${escapeHtml(check.reason ?? 'Invalid number format.')}\n\nSend /cancel to exit.`,
          parse_mode: 'HTML',
        },
      }];
    }

    store.setRegistrationState(userId, 'awaiting_label', {
      pendingPhoneNumber: check.normalized,
    });

    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          `✅ Format verified: <code>${escapeHtml(check.normalized)}</code>`,
          '',
          'Step 2 of 3: Reply with a short label for your number.',
        ].join('\n'),
        parse_mode: 'HTML',
      },
    }];
  }

  if (session.registrationStep === 'awaiting_label') {
    const cleanLabel = text.trim().slice(0, 40) || 'My Authorized Line';

    store.setRegistrationState(userId, 'awaiting_attestation', {
      pendingLabel: cleanLabel,
    });

    return [{
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: [
          '🛡️ <b>Step 3 of 3: Ownership Attestation</b>',
          '',
          `<b>Number:</b> <code>${escapeHtml(session.pendingPhoneNumber ?? '')}</code>`,
          `<b>Label:</b> ${escapeHtml(cleanLabel)}`,
          '',
          'Confirm that you own or are authorized to manage this number.',
          'Do not use this bot to collect or share other people’s private verification codes.',
        ].join('\n'),
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: '✅ I Confirm Ownership & Save', callback_data: 'add_confirm:yes'}],
            [{text: '❌ Cancel Registration', callback_data: 'add_confirm:no'}],
          ],
        },
      },
    }];
  }

  return [{
    type: 'sendMessage',
    payload: {
      chat_id: chatId,
      text: 'Please tap the confirmation button or send /cancel.',
      parse_mode: 'HTML',
    },
  }];
}

function handleCallbackQuery(
  update: TelegramUpdate,
  store: BotAccountStore,
): BotAction[] {
  const query = update.callback_query;
  if (!query || !query.data) return [];

  const userId = query.from.id;
  const chatId = query.message?.chat.id ?? userId;

  store.getOrCreateSession(userId, query.from.first_name ?? 'User', query.from.username);

  const data = query.data;

  const actions: BotAction[] = [{
    type: 'answerCallbackQuery',
    payload: {callback_query_id: query.id},
  }];

  if (data === 'sms:demo') {
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: buildDemoSmsMessage(store, userId),
        parse_mode: 'HTML',
      },
    });
    return actions;
  }

  if (data === 'sms:clear') {
    store.clearDemoSms(userId);
    actions.push({
      type: 'sendMessage',
      payload: {
        chat_id: chatId,
        text: '🗑️ Your demo SMS history has been cleared.',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{text: '📥 Open Demo SMS Inbox', callback_data: 'sms:demo'}],
            [{text: '👤 My Account', callback_data: 'account:overview'}],
          ],
        },
      },
    });
    return actions;
  }

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
    if (!country) return actions;

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
            [{text: `➕ Register My ${country.code} Number`, callback_data: `add_country:${country.code}`}],
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
    if (!svc) return actions;

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
    if (!country) return actions;

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
          `Reply with your own number in E.164 format, for example <code>${escapeHtml(country.e164Example)}</code>.`,
          '',
          'Send /cancel to abort.',
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
          text: 'No pending registration found. Start again from My Account.',
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
          '',
          'This number is listed under your account. Ownership has not been independently verified.',
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
        text: 'Registration cancelled. No number was saved.',
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
          text: 'You have no numbers saved yet.',
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
        text: '📋 <b>Manage Your Authorized Numbers</b>\n\nChoose a number to remove:',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...numbers.map((item) => [{
              text: `🗑️ Remove ${item.phoneNumber} (${item.label})`,
              callback_data: `account:delete:${item.id}`,
            }]),
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
        text: removed ? '🗑️ Number removed from your account.' : 'Number was not found.',
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
          '🔗 <b>Personal SMS Webhook Guide</b>',
          '',
          'A real SMS connection requires a provider or phone system that you own or are authorized to manage.',
          'Configure that system to send permitted notifications to your private integration.',
          '',
          'Never expose your Telegram bot token or forward third-party account verification codes.',
        ].join('\n'),
        parse_mode: 'HTML',
      },
    });
    return actions;
  }

  return actions;
}
