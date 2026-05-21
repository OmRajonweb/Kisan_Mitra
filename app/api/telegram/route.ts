// app/api/telegram/route.ts - Telegram webhook endpoint
import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { WeatherService } from '@/lib/weather'
import { TelegramService } from '@/lib/telegram'

// Store linking codes in memory (in production, use Redis or database)
const linkingCodes = new Map<string, { userId: string; expiresAt: number }>()

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()

    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true })
    }

    const message = update.message
    const chatId = message.chat.id
    const text = message.text.trim()
    const userId = message.from.id.toString()

    // Handle /start command
    if (text === '/start') {
      const welcomeMessage = `
🌾 <b>Welcome to Kisan Mitra Bot!</b>

I'm your AI farming assistant. Here's what I can do:

📊 <b>Commands:</b>
/link - Connect your web app account
/weather - Get current weather
/market - View market prices
/crops - See your crops
/tasks - View pending tasks
/help - Show this help message

<i>Get started by linking your account with /link</i>
`
      await TelegramService.sendMessage(chatId, welcomeMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /link command
    if (text === '/link') {
      const linkCode = TelegramService.generateLinkCode()
      
      // Store code for 10 minutes
      linkingCodes.set(linkCode, {
        userId,
        expiresAt: Date.now() + 10 * 60 * 1000,
      })

      const linkMessage = `
🔗 <b>Link Your Account</b>

Your linking code is: <code>${linkCode}</code>

1. Open Kisan Mitra web app
2. Go to Settings → Telegram
3. Enter this code

<i>Code expires in 10 minutes</i>
`
      await TelegramService.sendMessage(chatId, linkMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /weather command
    if (text === '/weather') {
      try {
        // Try to get user data from linked account
        const weather = await WeatherService.fetchWeather('Delhi') // Default location
        
        await TelegramService.sendWeatherAlert(chatId, {
          location: weather.location.city,
          temp: weather.current.temp,
          humidity: weather.current.humidity,
          condition: weather.current.condition,
          rainChance: weather.forecast[0]?.precipitation || 0,
        })
      } catch (error) {
        await TelegramService.sendMessage(
          chatId,
          '❌ Failed to fetch weather. Please link your account first using /link'
        )
      }
      return NextResponse.json({ ok: true })
    }

    // Handle /market command
    if (text === '/market') {
      const marketMessage = `
📊 <b>Market Prices</b>

<i>Please link your account with /link to see personalized market data for your crops.</i>

After linking, I'll show you real-time prices from your local mandis.
`
      await TelegramService.sendMessage(chatId, marketMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /crops command
    if (text === '/crops') {
      const cropsMessage = `
🌱 <b>Your Crops</b>

<i>Link your account with /link to see your crop details.</i>

I'll help you track:
• Planting dates
• Growth stages
• Harvest schedules
• Care reminders
`
      await TelegramService.sendMessage(chatId, cropsMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /tasks command
    if (text === '/tasks') {
      const tasksMessage = `
📋 <b>Pending Tasks</b>

<i>Link your account with /link to see your tasks.</i>

I'll remind you about:
• Irrigation schedules
• Fertilizer applications
• Pest monitoring
• Market visits
`
      await TelegramService.sendMessage(chatId, tasksMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /help command
    if (text === '/help') {
      const helpMessage = `
🌾 <b>Kisan Mitra Bot - Help</b>

<b>Available Commands:</b>
/link - Link your web app account
/weather - Current weather forecast
/market - Market prices
/crops - Your crop information
/tasks - Pending tasks
/help - Show this help

<b>Features:</b>
• Real-time weather alerts
• Market price notifications
• Crop care reminders
• AI farming assistant
• Voice support in 10+ languages

<i>Visit: kisanmitraapp.vercel.app</i>
`
      await TelegramService.sendMessage(chatId, helpMessage)
      return NextResponse.json({ ok: true })
    }

    // Default response for unknown commands
    await TelegramService.sendMessage(
      chatId,
      '❓ Unknown command. Type /help to see available commands.'
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Verify linking code endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400 })
  }

  const linkData = linkingCodes.get(code)

  if (!linkData) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 404 })
  }

  if (Date.now() > linkData.expiresAt) {
    linkingCodes.delete(code)
    return NextResponse.json({ error: 'Code expired' }, { status: 410 })
  }

  // Return user ID for linking
  linkingCodes.delete(code) // Use code only once
  return NextResponse.json({ userId: linkData.userId, ok: true })
}
