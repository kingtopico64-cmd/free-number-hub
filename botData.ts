import type {
  BotCommand,
  CountrySpec,
  DeploymentGuide,
  ReplyKeyboardMarkup,
  SmsServiceSpec,
} from './types.ts';

export const BOT_BUTTONS = {
  COUNTRIES: '🌍 Countries',
  SMS_SERVICES: '📱 SMS Services',
  MY_ACCOUNT: '👤 My Account',
  HELP: '💬 Help',
  ABOUT_US: 'ℹ️ About Us',
} as const;

export const MAIN_REPLY_KEYBOARD: ReplyKeyboardMarkup = {
  keyboard: [
    [{text: BOT_BUTTONS.COUNTRIES}, {text: BOT_BUTTONS.SMS_SERVICES}],
    [{text: BOT_BUTTONS.MY_ACCOUNT}, {text: BOT_BUTTONS.HELP}],
    [{text: BOT_BUTTONS.ABOUT_US}],
  ],
  resize_keyboard: true,
  input_field_placeholder: 'Choose a menu button or type /help...',
};

export const BOT_COMMANDS: BotCommand[] = [
  {command: 'start', description: 'Welcome screen and main mobile keyboard'},
  {command: 'countries', description: 'Browse supported countries and E.164 formats'},
  {command: 'services', description: 'Explore legitimate SMS workflows'},
  {command: 'account', description: 'Manage your own authorized numbers'},
  {command: 'addnumber', description: 'Register a phone number you own or control'},
  {command: 'help', description: 'Setup instructions, commands, and privacy rules'},
  {command: 'about', description: 'About Free Number Hub and our ownership policy'},
];

export const COUNTRIES: CountrySpec[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    region: 'North America',
    e164Example: '+14155550199',
    digitsHint: '10 digits after +1 (NANP)',
    authorizedProviders: ['Twilio', 'Telnyx', 'Vonage', 'Personal Carrier SIM'],
    complianceNote:
      'Requires A2P 10DLC or verified toll-free registration for automated outbound business traffic; personal inbound routing is permitted on lines you own.',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    region: 'Europe',
    e164Example: '+447700900123',
    digitsHint: '10 digits after +44 (drop leading 0)',
    authorizedProviders: ['Twilio UK', 'Vonage', 'MessageBird', 'UK Mobile SIM'],
    complianceNote:
      'Only route SMS from UK mobile or virtual numbers registered in your own organization or personal account.',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    region: 'North America',
    e164Example: '+14165550142',
    digitsHint: '10 digits after +1 (Canadian area code)',
    authorizedProviders: ['Twilio', 'Telnyx', 'VoIP.ms', 'Canadian Carrier SIM'],
    complianceNote:
      'Subject to CASL consent rules and Canadian telecom verification when connecting programmable VoIP lines.',
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    region: 'Europe',
    e164Example: '+4915123456789',
    digitsHint: '10–11 digits after +49 (drop leading 0)',
    authorizedProviders: ['Sipgate', 'Twilio DE', 'Placetel', 'German eSIM'],
    complianceNote:
      'German regulations require identity/address verification (Bundesnetzagentur) on carrier-issued virtual numbers.',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '+61',
    region: 'Asia-Pacific',
    e164Example: '+61412345678',
    digitsHint: '9 digits after +61 (drop leading 0)',
    authorizedProviders: ['Twilio AU', 'Telstra', 'MessageMedia', 'AU Mobile SIM'],
    complianceNote:
      'ACMA sender ID and KYC verification apply for business SMS accounts; personal SIM forwarding stays private to your chat.',
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    dialCode: '+65',
    region: 'Asia-Pacific',
    e164Example: '+6581234567',
    digitsHint: '8 digits after +65',
    authorizedProviders: ['Twilio SG', 'Vonage', 'Singtel', 'SG Carrier SIM'],
    complianceNote:
      'IMDA SSIR registration is required for commercial sender IDs; private inbound routing is restricted to your own line.',
  },
  {
    code: 'NL',
    name: 'Netherlands',
    flag: '🇳🇱',
    dialCode: '+31',
    region: 'Europe',
    e164Example: '+31612345678',
    digitsHint: '9 digits after +31 (drop leading 0)',
    authorizedProviders: ['MessageBird (Bird)', 'CM.com', 'Twilio NL', 'NL SIM'],
    complianceNote:
      'Supports clean E.164 inbound webhook forwarding from Dutch VoIP or personal dual-SIM setups.',
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    region: 'Europe',
    e164Example: '+33612345678',
    digitsHint: '9 digits after +33 (drop leading 0)',
    authorizedProviders: ['OVH Telecom', 'Twilio FR', 'Vonage', 'FR Carrier SIM'],
    complianceNote:
      'Requires KYC documentation with your telecom provider before activating inbound SMS webhooks.',
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    dialCode: '+81',
    region: 'Asia-Pacific',
    e164Example: '+819012345678',
    digitsHint: '10 digits after +81 (drop leading 0)',
    authorizedProviders: ['Twilio JP', 'KDDI', 'SoftBank', 'JP Carrier SIM'],
    complianceNote:
      'Voice/SMS-enabled virtual lines in Japan require strict identity verification under telecom rules.',
  },
  {
      {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    dialCode: '+234',
    region: 'Africa',
    e164Example: '+2348012345678',
    digitsHint: '10 digits after +234 (drop leading 0)',
    authorizedProviders: ['Nigerian Mobile Carrier SIM'],
    complianceNote:
      'Use only a Nigerian number you own or are authorized to manage.',
  },
  },
];

export const SMS_SERVICES: SmsServiceSpec[] = [
  {
    id: 'qa_staging',
    title: 'QA & Staging App Verification',
    category: 'Developer Testing',
    summary:
      'Route SMS alerts from your own staging environments to Telegram so engineering teams can verify signup and notification templates on authorized test lines.',
    legitimateUse:
      'Automated end-to-end tests on apps you own, using dedicated test numbers provisioned under your own Twilio, Telnyx, or Vonage account.',
    setupSteps: [
      'Provision a dedicated test number in your own VoIP/CPaaS dashboard.',
      'Register that E.164 number inside 👤 My Account with ownership attestation.',
      'Configure your staging SMS webhook to forward only test-environment events to your private bot chat.',
    ],
    privacyRule:
      'Never route production customer verification codes into shared group chats or unowned public channels.',
  },
  {
    id: 'personal_2fa_backup',
    title: 'Personal Travel & Dual-SIM Backup',
    category: 'Personal Continuity',
    summary:
      'Forward SMS messages from a secondary personal SIM card sitting at home or an authorized personal VoIP line directly to your own Telegram account while traveling.',
    legitimateUse:
      'Accessing bank alerts, carrier notices, or two-factor prompts sent exclusively to a phone number registered in your own legal name.',
    setupSteps: [
      'Use an authorized personal SIM gateway app or personal VoIP number you control.',
      'Confirm ownership inside Free Number Hub via 👤 My Account -> Register Own Number.',
      'Keep your Telegram chat private and enable Telegram Two-Step Verification.',
    ],
    privacyRule:
      'Free Number Hub strictly prohibits monitoring, forwarding, or sharing verification codes belonging to any other person.',
  },
  {
    id: 'support_routing',
    title: 'Authorized Support Line Alerts',
    category: 'Business Operations',
    summary:
      'Receive inbound customer inquiry SMS messages from your company support number in a dedicated operations workflow.',
    legitimateUse:
      'Routing inbound customer text inquiries from your verified business toll-free or 10DLC number so staff can respond promptly.',
    setupSteps: [
      'Verify business ownership of your support number with your telecom provider.',
      'Attach your authorized business number to your account record.',
      'Filter out sensitive one-time passcodes before forwarding general support inquiries.',
    ],
    privacyRule:
      'Ensure customers receive clear notice and opt-in disclosures required by local telecom regulations.',
  },
  {
    id: 'webhook_sandbox',
    title: 'Carrier Webhook Diagnostics',
    category: 'Integration Engineering',
    summary:
      'Inspect E.164 formatting, country dialing rules, and carrier webhook payloads before deploying production SMS integrations.',
    legitimateUse:
      'Validating webhook signatures, payload schemas, and delivery status callbacks on your own sandbox numbers.',
    setupSteps: [
      'Check your target country E.164 specification under 🌍 Countries.',
      'Use an HTTPS webhook endpoint protected by a secret token header.',
      'Log delivery metadata safely without storing raw third-party OTP codes.',
    ],
    privacyRule:
      'Zero shared inbox: every registered number is isolated to the single Telegram user ID that attested ownership.',
  },
];

export const DEPLOYMENT_GUIDES: DeploymentGuide[] = [
  {
    id: 'render',
    provider: 'Render',
    tierSummary: 'Free Web Service (750 hrs/mo) · Webhook or Polling',
    recommendedMode: 'webhook',
    bestFor: 'Beginners who want automatic HTTPS URLs and GitHub auto-deploy for $0/month.',
    steps: [
      'Push your Free Number Hub repository to GitHub (confirm .env is listed in .gitignore).',
      'Create a new Web Service on Render connected to your repository.',
      'Set Build Command to: npm install && npm run build',
      'Set Start Command to: npm start',
      'Add Environment Variables in the Render dashboard: TELEGRAM_BOT_TOKEN, TELEGRAM_MODE=webhook, APP_URL=https://your-service.onrender.com, and TELEGRAM_WEBHOOK_SECRET.',
    ],
    envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_MODE=webhook', 'APP_URL', 'TELEGRAM_WEBHOOK_SECRET'],
  },
  {
    id: 'railway',
    provider: 'Railway',
    tierSummary: 'Trial / $5/mo Hobby Plan · Always-On Polling or Webhook',
    recommendedMode: 'polling',
    bestFor: 'Zero-sleep uptime with simple one-click environment secrets and instant logs.',
    steps: [
      'Create a new project in Railway and select "Deploy from GitHub repo".',
      'Open Variables and add TELEGRAM_BOT_TOKEN and TELEGRAM_MODE=polling (or webhook with your Railway domain).',
      'Railway automatically detects npm run build and npm start from package.json.',
      'Check Deploy Logs to confirm "Free Number Hub bot ready" appears without exposing any token.',
    ],
    envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_MODE=polling'],
  },
  {
    id: 'flyio',
    provider: 'Fly.io',
    tierSummary: 'Free Allowance (shared-cpu-1x) · Global Edge',
    recommendedMode: 'webhook',
    bestFor: 'Low-latency webhook handling close to Telegram datacenters.',
    steps: [
      'Install flyctl and run: fly launch --no-deploy',
      'Store your bot token securely using: fly secrets set TELEGRAM_BOT_TOKEN="your-token" TELEGRAM_WEBHOOK_SECRET="random-secret"',
      'Set TELEGRAM_MODE=webhook and APP_URL=https://your-app.fly.dev in fly.toml or secrets.',
      'Run fly deploy to build and start node server.ts on port 3000.',
    ],
    envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_MODE=webhook', 'APP_URL', 'TELEGRAM_WEBHOOK_SECRET'],
  },
  {
    id: 'koyeb',
    provider: 'Koyeb / VPS',
    tierSummary: 'Free Eco Web Service or $4–$6/mo VPS (Hetzner / DigitalOcean)',
    recommendedMode: 'polling',
    bestFor: 'Running a lightweight persistent Node 22 process with systemd or Docker.',
    steps: [
      'Provision a Node.js 22+ environment or Koyeb web service.',
      'Run npm ci && npm run build on the server.',
      'Export TELEGRAM_BOT_TOKEN in your host secret manager or systemd EnvironmentFile (chmod 600).',
      'Start the process with npm start (or pm2 start server.ts --interpreter tsx).',
    ],
    envVars: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_MODE=polling'],
  },
];
