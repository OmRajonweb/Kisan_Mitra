// scripts/setup-telegram-webhook.js
// Run this script after deploying to set up the Telegram webhook
const BOT_TOKEN = '7982555038:AAH69R6fzwuKgjv-nqE4PduOz4ocCXugE1o'
const WEBHOOK_URL = process.argv[2] || 'https://kisanmitraapp.vercel.app/api/telegram'

async function setupWebhook() {
  try {
    console.log('Setting up Telegram webhook...')
    console.log('Webhook URL:', WEBHOOK_URL)

    // Set webhook
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: WEBHOOK_URL }),
      }
    )

    const data = await response.json()

    if (data.ok) {
      console.log('✅ Webhook set successfully!')
      console.log('Response:', data)

      // Get webhook info
      const infoResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
      )
      const infoData = await infoResponse.json()

      console.log('\n📋 Webhook Info:')
      console.log('URL:', infoData.result.url)
      console.log('Pending updates:', infoData.result.pending_update_count)
      console.log('Last error:', infoData.result.last_error_message || 'None')

      // Get bot info
      const botResponse = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
      )
      const botData = await botResponse.json()

      console.log('\n🤖 Bot Info:')
      console.log('Username: @' + botData.result.username)
      console.log('Name:', botData.result.first_name)

      console.log('\n✅ Setup complete!')
      console.log('\nNext steps:')
      console.log('1. Open Telegram and search for @' + botData.result.username)
      console.log('2. Send /start to begin')
      console.log('3. Use /link to connect your account')
    } else {
      console.error('❌ Failed to set webhook:', data)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

setupWebhook()
