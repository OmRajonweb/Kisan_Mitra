// scripts/setup-telegram.js - Set up Telegram webhook
const BOT_TOKEN = '7982555038:AAH69R6fzwuKgjv-nqE4PduOz4ocCXugE1o'
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

// Get webhook URL from command line or use default
const WEBHOOK_URL = process.argv[2] || 'https://kisanmitraapp.vercel.app/api/telegram/webhook'

async function setupWebhook() {
  console.log('🔧 Setting up Telegram Webhook...\n')
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}\n`)

  try {
    // Set webhook
    console.log('Setting webhook...')
    const response = await fetch(`${BASE_URL}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        allowed_updates: ['message', 'callback_query'],
      }),
    })

    const data = await response.json()

    if (data.ok) {
      console.log('✅ Webhook set successfully!\n')
    } else {
      console.log('❌ Failed to set webhook:')
      console.log(data.description, '\n')
      return
    }

    // Verify webhook
    console.log('Verifying webhook...')
    const infoResponse = await fetch(`${BASE_URL}/getWebhookInfo`)
    const infoData = await infoResponse.json()

    if (infoData.ok) {
      const info = infoData.result
      console.log('✅ Webhook verified!\n')
      console.log('📊 Webhook Info:')
      console.log(`   URL: ${info.url}`)
      console.log(`   Pending updates: ${info.pending_update_count}`)
      console.log(`   Max connections: ${info.max_connections}`)
      console.log(`   IP: ${info.ip_address || 'N/A'}`)
      
      if (info.last_error_message) {
        console.log(`   ⚠️ Last error: ${info.last_error_message}`)
        console.log(`   Last error date: ${new Date(info.last_error_date * 1000).toLocaleString()}`)
      }
      console.log()
    }

    console.log('🎉 Setup complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Open Telegram')
    console.log('2. Search for your bot')
    console.log('3. Send /start')
    console.log('4. Try: /help, /weather, /market')
    console.log('\n💡 Note: Bot must be deployed to Vercel for webhook to work!')
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message)
    process.exit(1)
  }
}

setupWebhook()
