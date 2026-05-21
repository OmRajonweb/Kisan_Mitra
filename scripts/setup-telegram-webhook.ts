// scripts/setup-telegram-webhook.ts
/**
 * Setup script for Telegram webhook
 * 
 * Usage:
 *   npm run setup-telegram
 * 
 * This script will:
 * 1. Verify bot token is configured
 * 2. Get bot information
 * 3. Set webhook URL
 * 4. Verify webhook is active
 */

const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
    console.error('❌ Error: NEXT_PUBLIC_TELEGRAM_BOT_TOKEN is not set in .env.local')
    console.log('\nPlease add your bot token to .env.local:')
    console.log('NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token_here')
    process.exit(1)
}

const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`

async function getMe() {
    const response = await fetch(`${API_BASE}/getMe`)
    const data = await response.json()

    if (!data.ok) {
        throw new Error(`Failed to get bot info: ${data.description}`)
    }

    return data.result
}

async function setWebhook(url: string) {
    const response = await fetch(`${API_BASE}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    })

    const data = await response.json()

    if (!data.ok) {
        throw new Error(`Failed to set webhook: ${data.description}`)
    }

    return data.result
}

async function getWebhookInfo() {
    const response = await fetch(`${API_BASE}/getWebhookInfo`)
    const data = await response.json()

    if (!data.ok) {
        throw new Error(`Failed to get webhook info: ${data.description}`)
    }

    return data.result
}

async function main() {
    console.log('🤖 Telegram Bot Setup\n')

    try {
        // Step 1: Get bot information
        console.log('1️⃣ Getting bot information...')
        const botInfo = await getMe()
        console.log(`   ✅ Bot: @${botInfo.username} (${botInfo.first_name})`)
        console.log(`   ID: ${botInfo.id}\n`)

        // Step 2: Ask for webhook URL
        console.log('2️⃣ Webhook URL Configuration')
        console.log('   Enter your webhook URL (or press Enter to use default):')
        console.log('   Default: https://your-domain.com/api/telegram/webhook')
        console.log('   For local testing with ngrok: https://your-ngrok-url.ngrok.io/api/telegram/webhook\n')

        // For now, we'll use a placeholder. In production, you'd use readline to get user input
        const webhookUrl = process.argv[2] || ''

        if (!webhookUrl) {
            console.log('⚠️  No webhook URL provided.')
            console.log('\nTo set webhook, run:')
            console.log('   npm run setup-telegram https://your-domain.com/api/telegram/webhook')
            console.log('\nFor local testing with ngrok:')
            console.log('   1. Install ngrok: https://ngrok.com/')
            console.log('   2. Run: ngrok http 3000')
            console.log('   3. Copy the HTTPS URL')
            console.log('   4. Run: npm run setup-telegram https://your-ngrok-url.ngrok.io/api/telegram/webhook\n')

            // Show current webhook info
            console.log('3️⃣ Current webhook status:')
            const webhookInfo = await getWebhookInfo()
            console.log(`   URL: ${webhookInfo.url || '(not set)'}`)
            console.log(`   Pending updates: ${webhookInfo.pending_update_count}`)
            if (webhookInfo.last_error_message) {
                console.log(`   ⚠️  Last error: ${webhookInfo.last_error_message}`)
            }
            return
        }

        // Step 3: Set webhook
        console.log(`3️⃣ Setting webhook to: ${webhookUrl}`)
        await setWebhook(webhookUrl)
        console.log('   ✅ Webhook set successfully!\n')

        // Step 4: Verify webhook
        console.log('4️⃣ Verifying webhook...')
        const webhookInfo = await getWebhookInfo()
        console.log(`   URL: ${webhookInfo.url}`)
        console.log(`   Pending updates: ${webhookInfo.pending_update_count}`)

        if (webhookInfo.last_error_message) {
            console.log(`   ⚠️  Last error: ${webhookInfo.last_error_message}`)
            console.log(`   Error date: ${new Date(webhookInfo.last_error_date * 1000).toLocaleString()}`)
        } else {
            console.log('   ✅ No errors!\n')
        }

        console.log('🎉 Setup complete!')
        console.log('\nNext steps:')
        console.log('1. Open Telegram and search for your bot: @' + botInfo.username)
        console.log('2. Send /start to begin')
        console.log('3. Test the bot commands:\n')
        console.log('   /language - Change language')
        console.log('   /weather - Get weather')
        console.log('   /market - See market prices')
        console.log('   /ask How to grow wheat? - Ask AI')
        console.log('   Send a crop photo - Get diagnosis\n')

    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error)
        process.exit(1)
    }
}

main()
