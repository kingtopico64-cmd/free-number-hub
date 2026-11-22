Free Number Hub

A mobile-friendly Telegram bot and interactive web console for managing user-owned and explicitly authorized SMS phone numbers via the official Telegram Bot API.

Features

* 5 Mobile Reply Keyboard Buttons:
    * 🌍 Countries — Paginated directory of supported countries, dialing codes, E.164 rules, and carrier notes.
    * 📱 SMS Services — Guides for legitimate SMS workflows, including QA testing, personal travel backup, authorized support alerts, and carrier diagnostics.
    * 👤 My Account — Private per-user view of Telegram User ID and registered authorized numbers.
    * 💬 Help — Quick-start guide, commands, and privacy policy.
    * ℹ️ About Us — Project mission, security architecture, and ownership-only policy.

Telegram Commands

* /start — Open the bot
* /countries — View supported countries
* /services — View SMS services
* /account — View your account
* /addnumber — Register your own authorized number
* /help — Get help
* /about — About Free Number Hub
* /cancel — Cancel the current action

Security

Free Number Hub is designed for numbers you own or are explicitly authorized to manage. It validates phone-number formats and requires ownership confirmation. It does not collect or share other people’s private verification codes.

Public or shared phone numbers are not private and should not be used for personal account verification.

Requirements

* Node.js 22.14 or newer
* npm
* Telegram bot token from @BotFather

Local Setup

1. Clone this repository.
2. Install dependencies:

npm install

3. Copy .env.example to .env.
4. Add your Telegram bot token to .env:

TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_MODE=polling

5. Start the app:

npm run dev

Build and Test

npm run lint
npm run build
npm start

Deploy to Render

1. Push this repository to GitHub.
2. In Render, choose New → Blueprint and connect the repository.
3. Render reads the render.yaml configuration.
4. Set TELEGRAM_BOT_TOKEN in Render’s environment settings.
5. Use webhook mode for deployment.

The application uses APP_URL or Render’s RENDER_EXTERNAL_URL to configure its Telegram webhook.

Environment Variables

Variable	Purpose
TELEGRAM_BOT_TOKEN	Secret token from BotFather
TELEGRAM_MODE	polling or webhook
APP_URL	Public HTTPS address of the deployed app
TELEGRAM_WEBHOOK_SECRET	Secret used to verify webhook requests

Never commit your real bot token or .env file to GitHub.
