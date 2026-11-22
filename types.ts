
export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface ReplyKeyboardButton {
  text: string;
}

export interface ReplyKeyboardMarkup {
  keyboard: ReplyKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
  input_field_placeholder?: string;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface BotCommand {
  command: string;
  description: string;
}

export type BotReplyMarkup = ReplyKeyboardMarkup | InlineKeyboardMarkup;

export interface SendMessagePayload {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML';
  reply_markup?: BotReplyMarkup;
  disable_web_page_preview?: boolean;
}

export interface EditMessagePayload {
  chat_id: number;
  message_id: number;
  text: string;
  parse_mode?: 'HTML';
  reply_markup?: InlineKeyboardMarkup;
  disable_web_page_preview?: boolean;
}

export type BotAction =
  | {
      type: 'sendMessage';
      payload: SendMessagePayload;
    }
  | {
      type: 'editMessageText';
      payload: EditMessagePayload;
    }
  | {
      type: 'answerCallbackQuery';
      payload: {
        callback_query_id: string;
        text?: string;
        show_alert?: boolean;
      };
    };

export interface CountrySpec {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  region:
    | 'North America'
    | 'Europe'
    | 'Asia-Pacific'
    | 'Latin America'
    | 'Africa';
  e164Example: string;
  digitsHint: string;
  authorizedProviders: string[];
  complianceNote: string;
}

export interface SmsServiceSpec {
  id: string;
  title: string;
  category: string;
  summary: string;
  legitimateUse: string;
  setupSteps: string[];
  privacyRule: string;
}

export interface AuthorizedNumberRecord {
  id: string;
  userId: number;
  countryCode: string;
  phoneNumber: string;
  label: string;
  ownershipAttested: boolean;
  attestedAt: string;
}

export type RegistrationStep =
  | 'idle'
  | 'awaiting_number'
  | 'awaiting_label'
  | 'awaiting_attestation';

export interface UserSessionState {
  userId: number;
  firstName: string;
  username?: string;
  createdAt: string;
  registrationStep: RegistrationStep;
  pendingCountryCode?: string;
  pendingPhoneNumber?: string;
  pendingLabel?: string;
  numbers: AuthorizedNumberRecord[];
}

export interface DeploymentGuide {
  id: string;
  provider: string;
  tierSummary: string;
  recommendedMode: 'polling' | 'webhook';
  bestFor: string;
  steps: string[];
  envVars: string[];
}

export type ActiveTab = 'simulator' | 'setup' | 'catalog' | 'deploy';

export type RegionFilter =
  | 'All'
  | 'North America'
  | 'Europe'
  | 'Asia-Pacific'
  | 'Latin America'
  | 'Africa';

export interface BotButtonsMap {
  COUNTRIES: '🌍 Countries';
  SMS_SERVICES: '📱 SMS Services';
  MY_ACCOUNT: '👤 My Account';
  HELP: '💬 Help';
  ABOUT_US: 'ℹ️ About Us';
}

export interface ChatBubble {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  inlineKeyboard?: InlineKeyboardButton[][];
}

export interface BotRuntimeStatus {
  botConfigured: boolean;
  botUsername: string | null;
  mode: 'polling' | 'webhook' | 'standby';
  commandsCount: number;
  lastError: string | null;
}

export interface ServerHealthStatus extends BotRuntimeStatus {
  ok: boolean;
}

export interface BotCatalogResponse {
  buttons: BotButtonsMap;
  commands: BotCommand[];
  countries: CountrySpec[];
  services: SmsServiceSpec[];
  deploymentGuides: DeploymentGuide[];
}

export interface SimulatorUpdateRequest {
  sessionId?: string;
  text?: string;
  callbackData?: string;
  firstName?: string;
}

export interface SimulatorUpdateResponse {
  update: TelegramUpdate;
  actions: BotAction[];
  userId: number;
  authorizedNumbersCount: number;
}

export interface SimulatorExchange {
  update: TelegramUpdate | null;
  actions: BotAction[];
}

export interface SourceFileResponse {
  name: string;
  content: string;
}

export interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onResetSimulator: () => void;
}

export interface TelegramFormattedTextProps {
  html: string;
}

export interface TelegramSimulatorProps {
  sessionId: string;
  messages: ChatBubble[];
  replyKeyboard: ReplyKeyboardMarkup;
  lastExchange: SimulatorExchange;
  authorizedNumbersCount: number;
  isSending: boolean;
  onSendText: (text: string) => Promise<void>;
  onTapCallback: (callbackData: string, label: string) => Promise<void>;
  onReset: () => Promise<void>;
}

export interface SetupTokenViewProps {
  health: ServerHealthStatus | null;
  loadingHealth: boolean;
  onRefreshHealth: () => Promise<void>;
}

export interface CatalogViewProps {
  onTestCountryInBot: (countryCommandOrName: string) => void;
}
