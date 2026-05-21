// lib/telegram.ts - Enhanced Telegram Bot Service with Multilingual Support
import type { Language } from './i18n'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: {
    id: number
    type: string
  }
  text?: string
  photo?: Array<{ file_id: string; file_size: number }>
  voice?: { file_id: string; duration: number }
  date: number
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: {
    id: string
    from: TelegramUser
    message: TelegramMessage
    data: string
  }
}

export interface UserPreferences {
  language: Language
  location?: string
  crops?: string[]
  lastActive: string
}

export interface InlineKeyboardButton {
  text: string
  callback_data?: string
  url?: string
}

export class TelegramService {
  private static readonly BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
  private static readonly API_BASE = `https://api.telegram.org/bot${this.BOT_TOKEN}`

  // User preferences storage (in production, use database)
  private static userPrefs = new Map<number, UserPreferences>()

  static async sendMessage(
    chatId: number,
    text: string,
    options?: {
      parseMode?: 'HTML' | 'Markdown'
      replyMarkup?: {
        inline_keyboard?: InlineKeyboardButton[][]
        keyboard?: string[][]
        resize_keyboard?: boolean
        one_time_keyboard?: boolean
      }
    }
  ) {
    try {
      const response = await fetch(`${this.API_BASE}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: options?.parseMode || 'HTML',
          reply_markup: options?.replyMarkup,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Telegram API error: ${response.statusText} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to send Telegram message:', error)
      throw error
    }
  }

  static async sendPhoto(
    chatId: number,
    photoUrl: string,
    caption?: string
  ) {
    try {
      const response = await fetch(`${this.API_BASE}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoUrl,
          caption,
          parse_mode: 'HTML',
        }),
      })

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to send photo:', error)
      throw error
    }
  }

  static async getFile(fileId: string) {
    try {
      const response = await fetch(`${this.API_BASE}/getFile?file_id=${fileId}`)
      if (!response.ok) {
        throw new Error(`Failed to get file: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to get file:', error)
      throw error
    }
  }

  static async downloadFile(filePath: string): Promise<ArrayBuffer> {
    try {
      const url = `https://api.telegram.org/file/bot${this.BOT_TOKEN}/${filePath}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }
      return await response.arrayBuffer()
    } catch (error) {
      console.error('Failed to download file:', error)
      throw error
    }
  }

  // User Preferences Management
  static getUserPreferences(chatId: number): UserPreferences {
    return this.userPrefs.get(chatId) || {
      language: 'en',
      lastActive: new Date().toISOString(),
    }
  }

  static setUserPreferences(chatId: number, prefs: Partial<UserPreferences>) {
    const current = this.getUserPreferences(chatId)
    this.userPrefs.set(chatId, {
      ...current,
      ...prefs,
      lastActive: new Date().toISOString(),
    })
  }

  static getUserLanguage(chatId: number): Language {
    return this.getUserPreferences(chatId).language
  }

  static setUserLanguage(chatId: number, language: Language) {
    this.setUserPreferences(chatId, { language })
  }

  // Enhanced Message Formatters
  static async sendWeatherAlert(chatId: number, weather: any, lang: Language = 'en') {
    const langMap: Record<Language, any> = {
      en: {
        title: '🌤️ Weather Update',
        location: 'Location',
        temp: 'Temperature',
        humidity: 'Humidity',
        condition: 'Condition',
        rain: 'Rain expected',
        stay: 'Stay safe! 🌾',
      },
      hi: {
        title: '🌤️ मौसम अपडेट',
        location: 'स्थान',
        temp: 'तापमान',
        humidity: 'आर्द्रता',
        condition: 'स्थिति',
        rain: 'बारिश की संभावना',
        stay: 'सुरक्षित रहें! 🌾',
      },
      ta: {
        title: '🌤️ வானிலை புதுப்பிப்பு',
        location: 'இடம்',
        temp: 'வெப்பநிலை',
        humidity: 'ஈரப்பதம்',
        condition: 'நிலை',
        rain: 'மழை எதிர்பார்க்கப்படுகிறது',
        stay: 'பாதுகாப்பாக இருங்கள்! 🌾',
      },
      te: {
        title: '🌤️ వాతావరణ నవీకరణ',
        location: 'స్థానం',
        temp: 'ఉష్ణోగ్రత',
        humidity: 'తేమ',
        condition: 'పరిస్థితి',
        rain: 'వర్షం అంచనా',
        stay: 'సురక్షితంగా ఉండండి! 🌾',
      },
      ml: {
        title: '🌤️ കാലാവസ്ഥ അപ്ഡേറ്റ്',
        location: 'സ്ഥലം',
        temp: 'താപനില',
        humidity: 'ആർദ്രത',
        condition: 'അവസ്ഥ',
        rain: 'മഴ പ്രതീക്ഷിക്കുന്നു',
        stay: 'സുരക്ഷിതരായിരിക്കുക! 🌾',
      },
      kn: {
        title: '🌤️ ಹವಾಮಾನ ನವೀಕರಣ',
        location: 'ಸ್ಥಳ',
        temp: 'ತಾಪಮಾನ',
        humidity: 'ಆರ್ದ್ರತೆ',
        condition: 'ಸ್ಥಿತಿ',
        rain: 'ಮಳೆ ನಿರೀಕ್ಷೆ',
        stay: 'ಸುರಕ್ಷಿತವಾಗಿರಿ! 🌾',
      },
      gu: {
        title: '🌤️ હવામાન અપડેટ',
        location: 'સ્થાન',
        temp: 'તાપમાન',
        humidity: 'ભેજ',
        condition: 'સ્થિતિ',
        rain: 'વરસાદની અપેક્ષા',
        stay: 'સુરક્ષિત રહો! 🌾',
      },
      bn: {
        title: '🌤️ আবহাওয়া আপডেট',
        location: 'অবস্থান',
        temp: 'তাপমাত্রা',
        humidity: 'আর্দ্রতা',
        condition: 'অবস্থা',
        rain: 'বৃষ্টির সম্ভাবনা',
        stay: 'নিরাপদ থাকুন! 🌾',
      },
      mr: {
        title: '🌤️ हवामान अपडेट',
        location: 'स्थान',
        temp: 'तापमान',
        humidity: 'आर्द्रता',
        condition: 'स्थिती',
        rain: 'पाऊस अपेक्षित',
        stay: 'सुरक्षित रहा! 🌾',
      },
      pa: {
        title: '🌤️ ਮੌਸਮ ਅੱਪਡੇਟ',
        location: 'ਸਥਾਨ',
        temp: 'ਤਾਪਮਾਨ',
        humidity: 'ਨਮੀ',
        condition: 'ਸਥਿਤੀ',
        rain: 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ',
        stay: 'ਸੁਰੱਖਿਅਤ ਰਹੋ! 🌾',
      },
    }

    const t = langMap[lang] || langMap.en

    const text = `
<b>${t.title}</b>

📍 ${t.location}: ${weather.location}
🌡️ ${t.temp}: ${weather.temp}°C
💧 ${t.humidity}: ${weather.humidity}%
☁️ ${t.condition}: ${weather.condition}
${weather.rainChance > 50 ? `\n⚠️ ${t.rain}: ${weather.rainChance}%` : ''}

${t.stay}
`
    return this.sendMessage(chatId, text)
  }

  static async sendMarketPrices(chatId: number, prices: any[], lang: Language = 'en') {
    const langMap: Record<Language, any> = {
      en: { title: '📊 Market Prices', price: 'Price', change: 'Change', mandi: 'Mandi', updated: 'Updated' },
      hi: { title: '📊 बाजार भाव', price: 'मूल्य', change: 'परिवर्तन', mandi: 'मंडी', updated: 'अपडेट किया गया' },
      ta: { title: '📊 சந்தை விலைகள்', price: 'விலை', change: 'மாற்றம்', mandi: 'மண்டி', updated: 'புதுப்பிக்கப்பட்டது' },
      te: { title: '📊 మార్కెట్ ధరలు', price: 'ధర', change: 'మార్పు', mandi: 'మండి', updated: 'నవీకరించబడింది' },
      ml: { title: '📊 മാർക്കറ്റ് വിലകൾ', price: 'വില', change: 'മാറ്റം', mandi: 'മണ്ഡി', updated: 'അപ്ഡേറ്റ് ചെയ്തു' },
      kn: { title: '📊 ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು', price: 'ಬೆಲೆ', change: 'ಬದಲಾವಣೆ', mandi: 'ಮಂಡಿ', updated: 'ನವೀಕರಿಸಲಾಗಿದೆ' },
      gu: { title: '📊 બજાર ભાવ', price: 'ભાવ', change: 'ફેરફાર', mandi: 'મંડી', updated: 'અપડેટ કર્યું' },
      bn: { title: '📊 বাজার দাম', price: 'দাম', change: 'পরিবর্তন', mandi: 'মান্ডি', updated: 'আপডেট করা হয়েছে' },
      mr: { title: '📊 बाजार भाव', price: 'किंमत', change: 'बदल', mandi: 'मंडी', updated: 'अद्यतनित' },
      pa: { title: '📊 ਮਾਰਕੀਟ ਕੀਮਤਾਂ', price: 'ਕੀਮਤ', change: 'ਤਬਦੀਲੀ', mandi: 'ਮੰਡੀ', updated: 'ਅੱਪਡੇਟ ਕੀਤਾ' },
    }

    const t = langMap[lang] || langMap.en

    let text = `<b>${t.title}</b>\n\n`

    prices.slice(0, 5).forEach((p) => {
      const emoji = p.trend === 'up' ? '📈' : '📉'
      text += `${emoji} <b>${p.name}</b>\n`
      text += `   💰 ₹${p.price}/${p.unit}\n`
      text += `   ${p.change > 0 ? '↗️' : '↘️'} ${Math.abs(p.change).toFixed(1)}%\n`
      text += `   📍 ${p.market}\n\n`
    })

    text += `<i>${t.updated}: ${new Date().toLocaleTimeString()}</i>`

    return this.sendMessage(chatId, text)
  }

  static async sendCropReminder(chatId: number, task: any, lang: Language = 'en') {
    const text = `
🌱 <b>Crop Reminder</b>

📋 Task: ${task.title}
🌾 Crop: ${task.crop}
⏰ Due: ${task.dueDate}

${task.description ? `\n📝 ${task.description}` : ''}

Complete your task! ✅
`
    return this.sendMessage(chatId, text)
  }

  // Inline Keyboard Helpers
  static createLanguageKeyboard(): InlineKeyboardButton[][] {
    return [
      [
        { text: '🇬🇧 English', callback_data: 'lang_en' },
        { text: '🇮🇳 हिंदी', callback_data: 'lang_hi' },
      ],
      [
        { text: '🇮🇳 தமிழ்', callback_data: 'lang_ta' },
        { text: '🇮🇳 తెలుగు', callback_data: 'lang_te' },
      ],
      [
        { text: '🇮🇳 മലയാളം', callback_data: 'lang_ml' },
        { text: '🇮🇳 ಕನ್ನಡ', callback_data: 'lang_kn' },
      ],
      [
        { text: '🇮🇳 ગુજરાતી', callback_data: 'lang_gu' },
        { text: '🇮🇳 বাংলা', callback_data: 'lang_bn' },
      ],
      [
        { text: '🇮🇳 मराठी', callback_data: 'lang_mr' },
        { text: '🇮🇳 ਪੰਜਾਬੀ', callback_data: 'lang_pa' },
      ],
    ]
  }

  static async getMe() {
    try {
      const response = await fetch(`${this.API_BASE}/getMe`)
      return await response.json()
    } catch (error) {
      console.error('Failed to get bot info:', error)
      throw error
    }
  }

  static async setWebhook(url: string) {
    try {
      const response = await fetch(`${this.API_BASE}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      return await response.json()
    } catch (error) {
      console.error('Failed to set webhook:', error)
      throw error
    }
  }

  // Generate a unique linking code for user authentication
  static generateLinkCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // Store telegram chat ID with user data (localStorage)
  static linkTelegramAccount(userId: string, chatId: number, telegramUser: TelegramUser) {
    if (typeof window === 'undefined') return

    const linkData = {
      chatId,
      telegramUser,
      linkedAt: new Date().toISOString(),
    }

    localStorage.setItem('kisanMitraTelegram', JSON.stringify(linkData))
  }

  // Get linked Telegram account
  static getLinkedAccount(): { chatId: number; telegramUser: TelegramUser } | null {
    if (typeof window === 'undefined') return null

    const data = localStorage.getItem('kisanMitraTelegram')
    return data ? JSON.parse(data) : null
  }

  // Unlink Telegram account
  static unlinkAccount() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('kisanMitraTelegram')
  }
}
