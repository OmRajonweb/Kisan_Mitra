// scripts/test-telegram.js - Quick bot tester
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

async function testBot() {
  console.log('🤖 Testing Kisan Mitra Telegram Bot...\n')

  // 1. Check bot info
  console.log('1️⃣ Checking bot info...')
  try {
    const meResponse = await fetch(`${BASE_URL}/getMe`)
    const meData = await meResponse.json()
    
    if (meData.ok) {
      console.log('✅ Bot is active!')
      console.log(`   Name: ${meData.result.first_name}`)
      console.log(`   Username: @${meData.result.username}`)
      console.log(`   ID: ${meData.result.id}\n`)
    } else {
      console.log('❌ Bot token invalid!\n')
      return
    }
  } catch (error) {
    console.log('❌ Failed to connect:', error.message, '\n')
    return
  }

  // 2. Check webhook
  console.log('2️⃣ Checking webhook status...')
  try {
    const webhookResponse = await fetch(`${BASE_URL}/getWebhookInfo`)
    const webhookData = await webhookResponse.json()
    
    if (webhookData.ok) {
      const info = webhookData.result
      console.log(`   URL: ${info.url || '(not set)'}`)
      console.log(`   Pending updates: ${info.pending_update_count}`)
      console.log(`   Last error: ${info.last_error_message || 'None'}`)
      console.log(`   Last error date: ${info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'N/A'}\n`)
    }
  } catch (error) {
    console.log('❌ Failed to get webhook info:', error.message, '\n')
  }

  // 3. Get recent updates (polling mode)
  console.log('3️⃣ Checking for recent messages...')
  try {
    const updatesResponse = await fetch(`${BASE_URL}/getUpdates?limit=5`)
    const updatesData = await updatesResponse.json()
    
    if (updatesData.ok && updatesData.result.length > 0) {
      console.log(`   Found ${updatesData.result.length} recent message(s):`)
      updatesData.result.forEach((update, i) => {
        const msg = update.message
        console.log(`   ${i + 1}. From: ${msg.from.first_name} (@${msg.from.username || 'no username'})`)
        console.log(`      Text: ${msg.text || '(no text)'}`)
        console.log(`      Chat ID: ${msg.chat.id}`)
      })
      console.log()
    } else {
      console.log('   No recent messages\n')
    }
  } catch (error) {
    console.log('❌ Failed to get updates:', error.message, '\n')
  }

  console.log('✅ Bot test complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Open Telegram and search for your bot')
  console.log('2. Send /start to begin')
  console.log('3. Run: node scripts/setup-telegram.js (to set webhook)')
  console.log('4. Deploy to Vercel')
  console.log('5. Test commands: /weather, /market, /help')
}

testBot().catch(console.error)
