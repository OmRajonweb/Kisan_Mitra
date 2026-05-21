// app/api/telegram/webhook/route.ts - Enhanced Telegram Webhook with Full AI Integration
import { NextRequest, NextResponse } from 'next/server'
import { TelegramService } from '@/lib/telegram'
import { GroqService } from '@/lib/groq'
import { MarketService } from '@/lib/market'
import { WeatherService } from '@/lib/weather'
import type { Language } from '@/lib/i18n'

const groqService = new GroqService()

// Multilingual command translations
const commands: Record<string, Record<Language, string[]>> = {
  start: {
    en: ['/start'],
    hi: ['/start', '/शुरू'],
    ta: ['/start', '/தொடங்கு'],
    te: ['/start', '/ప్రారంభం'],
    ml: ['/start', '/ആരംഭിക്കുക'],
    kn: ['/start', '/ಪ್ರಾರಂಭ'],
    gu: ['/start', '/શરૂ'],
    bn: ['/start', '/শুরু'],
    mr: ['/start', '/सुरू'],
    pa: ['/start', '/ਸ਼ੁਰੂ'],
  },
}

// Multilingual messages
const messages = {
  welcome: {
    en: `🌾 <b>Welcome to Kisan Mitra!</b>

I'm your AI farming assistant. I can help you with:

🌤️ Weather forecasts & alerts
📊 Live market prices & MSP
🌱 Crop advice & diagnosis
🤖 AI-powered farming tips

<b>Choose your language:</b>`,
    hi: `🌾 <b>किसान मित्र में आपका स्वागत है!</b>

मैं आपका AI कृषि सहायक हूं। मैं आपकी मदद कर सकता हूं:

🌤️ मौसम पूर्वानुमान और अलर्ट
📊 लाइव बाजार भाव और MSP
🌱 फसल सलाह और निदान
🤖 AI-संचालित कृषि सुझाव

<b>अपनी भाषा चुनें:</b>`,
    ta: `🌾 <b>கிசான் மித்ராவுக்கு வரவேற்கிறோம்!</b>

நான் உங்கள் AI விவசாய உதவியாளர். நான் உங்களுக்கு உதவ முடியும்:

🌤️ வானிலை முன்னறிவிப்புகள் & எச்சரிக்கைகள்
📊 நேரடி சந்தை விலைகள் & MSP
🌱 பயிர் ஆலோசனை & நோய் கண்டறிதல்
🤖 AI-இயக்கப்படும் விவசாய குறிப்புகள்

<b>உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்:</b>`,
    te: `🌾 <b>కిసాన్ మిత్రకు స్వాగతం!</b>

నేను మీ AI వ్యవసాయ సహాయకుడిని. నేను మీకు సహాయం చేయగలను:

🌤️ వాతావరణ అంచనాలు & హెచ్చరికలు
📊 ప్రత్యక్ష మార్కెట్ ధరలు & MSP
🌱 పంట సలహా & రోగ నిర్ధారణ
🤖 AI-ఆధారిత వ్యవసాయ చిట్కాలు

<b>మీ భాషను ఎంచుకోండి:</b>`,
    ml: `🌾 <b>കിസാൻ മിത്രയിലേക്ക് സ്വാഗതം!</b>

ഞാൻ നിങ്ങളുടെ AI കൃഷി സഹായകനാണ്. എനിക്ക് നിങ്ങളെ സഹായിക്കാം:

🌤️ കാലാവസ്ഥ പ്രവചനങ്ങളും മുന്നറിയിപ്പുകളും
📊 തത്സമയ വിപണി വിലകളും MSP
🌱 വിള ഉപദേശവും രോഗനിർണയവും
🤖 AI-പ്രവർത്തിക്കുന്ന കൃഷി നുറുങ്ങുകൾ

<b>നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കുക:</b>`,
    kn: `🌾 <b>ಕಿಸಾನ್ ಮಿತ್ರಕ್ಕೆ ಸ್ವಾಗತ!</b>

ನಾನು ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:

🌤️ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಗಳು & ಎಚ್ಚರಿಕೆಗಳು
📊 ನೇರ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು & MSP
🌱 ಬೆಳೆ ಸಲಹೆ & ರೋಗ ನಿರ್ಣಯ
🤖 AI-ಚಾಲಿತ ಕೃಷಿ ಸಲಹೆಗಳು

<b>ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:</b>`,
    gu: `🌾 <b>કિસાન મિત્રમાં આપનું સ્વાગત છે!</b>

હું તમારો AI ખેતી સહાયક છું. હું તમને મદદ કરી શકું છું:

🌤️ હવામાન આગાહી અને ચેતવણીઓ
📊 લાઇવ બજાર ભાવ અને MSP
🌱 પાક સલાહ અને નિદાન
🤖 AI-સંચાલિત ખેતી ટિપ્સ

<b>તમારી ભાષા પસંદ કરો:</b>`,
    bn: `🌾 <b>কিষাণ মিত্রে স্বাগতম!</b>

আমি আপনার AI কৃষি সহায়ক। আমি আপনাকে সাহায্য করতে পারি:

🌤️ আবহাওয়ার পূর্বাভাস ও সতর্কতা
📊 লাইভ বাজার দাম ও MSP
🌱 ফসল পরামর্শ ও রোগ নির্ণয়
🤖 AI-চালিত কৃষি টিপস

<b>আপনার ভাষা নির্বাচন করুন:</b>`,
    mr: `🌾 <b>किसान मित्रात आपले स्वागत आहे!</b>

मी तुमचा AI शेती सहाय्यक आहे. मी तुम्हाला मदत करू शकतो:

🌤️ हवामान अंदाज आणि सूचना
📊 थेट बाजार भाव आणि MSP
🌱 पीक सल्ला आणि निदान
🤖 AI-चालित शेती टिपा

<b>तुमची भाषा निवडा:</b>`,
    pa: `🌾 <b>ਕਿਸਾਨ ਮਿੱਤਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ!</b>

ਮੈਂ ਤੁਹਾਡਾ AI ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:

🌤️ ਮੌਸਮ ਦੀ ਭਵਿੱਖਬਾਣੀ ਅਤੇ ਚੇਤਾਵਨੀਆਂ
📊 ਲਾਈਵ ਮਾਰਕੀਟ ਕੀਮਤਾਂ ਅਤੇ MSP
🌱 ਫਸਲ ਸਲਾਹ ਅਤੇ ਨਿਦਾਨ
🤖 AI-ਸੰਚਾਲਿਤ ਖੇਤੀ ਟਿੱਪਸ

<b>ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ:</b>`,
  },
  help: {
    en: `📚 <b>Available Commands</b>

/language - Change language
/location [city] - Set your location
/weather - Current weather
/market [crop] - Market prices
/msp [crop] - Check MSP
/ask [question] - Ask AI anything
/diagnose - Upload crop photo for diagnosis
/help - Show this help

Just send me a message or photo anytime!`,
    hi: `📚 <b>उपलब्ध कमांड</b>

/language - भाषा बदलें
/location [शहर] - अपना स्थान सेट करें
/weather - वर्तमान मौसम
/market [फसल] - बाजार भाव
/msp [फसल] - MSP जांचें
/ask [प्रश्न] - AI से कुछ भी पूछें
/diagnose - निदान के लिए फसल फोटो अपलोड करें
/help - यह मदद दिखाएं

मुझे कभी भी संदेश या फोटो भेजें!`,
    ta: `📚 <b>கிடைக்கும் கட்டளைகள்</b>

/language - மொழியை மாற்று
/location [நகரம்] - உங்கள் இடத்தை அமைக்கவும்
/weather - தற்போதைய வானிலை
/market [பயிர்] - சந்தை விலைகள்
/msp [பயிர்] - MSP சரிபார்க்கவும்
/ask [கேள்வி] - AI யிடம் எதையும் கேளுங்கள்
/diagnose - நோய் கண்டறிதலுக்கு பயிர் புகைப்படத்தை பதிவேற்றவும்
/help - இந்த உதவியைக் காட்டு

எனக்கு எப்போது வேண்டுமானாலும் செய்தி அல்லது புகைப்படம் அனுப்பவும்!`,
    te: `📚 <b>అందుబాటులో ఉన్న ఆదేశాలు</b>

/language - భాషను మార్చండి
/location [నగరం] - మీ స్థానాన్ని సెట్ చేయండి
/weather - ప్రస్తుత వాతావరణం
/market [పంట] - మార్కెట్ ధరలు
/msp [పంట] - MSP తనిఖీ చేయండి
/ask [ప్రశ్న] - AI ని ఏదైనా అడగండి
/diagnose - రోగ నిర్ధారణ కోసం పంట ఫోటోను అప్‌లోడ్ చేయండి
/help - ఈ సహాయాన్ని చూపించు

నాకు ఎప్పుడైనా సందేశం లేదా ఫోటో పంపండి!`,
    ml: `📚 <b>ലഭ്യമായ കമാൻഡുകൾ</b>

/language - ഭാഷ മാറ്റുക
/location [നഗരം] - നിങ്ങളുടെ സ്ഥലം സജ്ജമാക്കുക
/weather - നിലവിലെ കാലാവസ്ഥ
/market [വിള] - വിപണി വിലകൾ
/msp [വിള] - MSP പരിശോധിക്കുക
/ask [ചോദ്യം] - AI യോട് എന്തും ചോദിക്കുക
/diagnose - രോഗനിർണയത്തിനായി വിള ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക
/help - ഈ സഹായം കാണിക്കുക

എനിക്ക് എപ്പോൾ വേണമെങ്കിലും സന്ദേശമോ ഫോട്ടോയോ അയയ്ക്കുക!`,
    kn: `📚 <b>ಲಭ್ಯವಿರುವ ಆಜ್ಞೆಗಳು</b>

/language - ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ
/location [ನಗರ] - ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹೊಂದಿಸಿ
/weather - ಪ್ರಸ್ತುತ ಹವಾಮಾನ
/market [ಬೆಳೆ] - ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು
/msp [ಬೆಳೆ] - MSP ಪರಿಶೀಲಿಸಿ
/ask [ಪ್ರಶ್ನೆ] - AI ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ
/diagnose - ರೋಗ ನಿರ್ಣಯಕ್ಕಾಗಿ ಬೆಳೆ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ
/help - ಈ ಸಹಾಯವನ್ನು ತೋರಿಸಿ

ನನಗೆ ಯಾವಾಗ ಬೇಕಾದರೂ ಸಂದೇಶ ಅಥವಾ ಫೋಟೋ ಕಳುಹಿಸಿ!`,
    gu: `📚 <b>ઉપલબ્ધ આદેશો</b>

/language - ભાષા બદલો
/location [શહેર] - તમારું સ્થાન સેટ કરો
/weather - વર્તમાન હવામાન
/market [પાક] - બજાર ભાવ
/msp [પાક] - MSP તપાસો
/ask [પ્રશ્ન] - AI ને કંઈપણ પૂછો
/diagnose - નિદાન માટે પાક ફોટો અપલોડ કરો
/help - આ મદદ બતાવો

મને ક્યારે પણ સંદેશ અથવા ફોટો મોકલો!`,
    bn: `📚 <b>উপলব্ধ কমান্ড</b>

/language - ভাষা পরিবর্তন করুন
/location [শহর] - আপনার অবস্থান সেট করুন
/weather - বর্তমান আবহাওয়া
/market [ফসল] - বাজার দাম
/msp [ফসল] - MSP পরীক্ষা করুন
/ask [প্রশ্ন] - AI কে যেকোনো কিছু জিজ্ঞাসা করুন
/diagnose - রোগ নির্ণয়ের জন্য ফসলের ছবি আপলোড করুন
/help - এই সাহায্য দেখান

আমাকে যেকোনো সময় বার্তা বা ছবি পাঠান!`,
    mr: `📚 <b>उपलब्ध आदेश</b>

/language - भाषा बदला
/location [शहर] - तुमचे स्थान सेट करा
/weather - सध्याचे हवामान
/market [पीक] - बाजार भाव
/msp [पीक] - MSP तपासा
/ask [प्रश्न] - AI ला काहीही विचारा
/diagnose - निदानासाठी पीक फोटो अपलोड करा
/help - ही मदत दाखवा

मला कधीही संदेश किंवा फोटो पाठवा!`,
    pa: `📚 <b>ਉਪਲਬਧ ਕਮਾਂਡਾਂ</b>

/language - ਭਾਸ਼ਾ ਬਦਲੋ
/location [ਸ਼ਹਿਰ] - ਆਪਣਾ ਸਥਾਨ ਸੈੱਟ ਕਰੋ
/weather - ਮੌਜੂਦਾ ਮੌਸਮ
/market [ਫਸਲ] - ਮਾਰਕੀਟ ਕੀਮਤਾਂ
/msp [ਫਸਲ] - MSP ਜਾਂਚ ਕਰੋ
/ask [ਸਵਾਲ] - AI ਨੂੰ ਕੁਝ ਵੀ ਪੁੱਛੋ
/diagnose - ਨਿਦਾਨ ਲਈ ਫਸਲ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ
/help - ਇਹ ਮਦਦ ਦਿਖਾਓ

ਮੈਨੂੰ ਕਿਸੇ ਵੀ ਸਮੇਂ ਸੁਨੇਹਾ ਜਾਂ ਫੋਟੋ ਭੇਜੋ!`,
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📨 Telegram webhook received')

    // Handle callback queries (inline keyboard button presses)
    if (body.callback_query) {
      const callbackQuery = body.callback_query
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data

      // Language selection
      if (data.startsWith('lang_')) {
        const lang = data.replace('lang_', '') as Language
        TelegramService.setUserLanguage(chatId, lang)

        await TelegramService.sendMessage(chatId, messages.help[lang] || messages.help.en)
        return NextResponse.json({ ok: true })
      }
    }

    if (!body.message) {
      return NextResponse.json({ ok: true })
    }

    const message = body.message
    const chatId = message.chat.id
    const text = message.text || ''
    const userLang = TelegramService.getUserLanguage(chatId)

    // Handle /start command
    if (text.startsWith('/start')) {
      const welcomeMsg = messages.welcome[userLang] || messages.welcome.en
      await TelegramService.sendMessage(chatId, welcomeMsg, {
        replyMarkup: {
          inline_keyboard: TelegramService.createLanguageKeyboard(),
        },
      })
      return NextResponse.json({ ok: true })
    }

    // Handle /language command
    if (text.startsWith('/language')) {
      const langMsg = userLang === 'en' ? 'Choose your language:' : 'अपनी भाषा चुनें:'
      await TelegramService.sendMessage(chatId, langMsg, {
        replyMarkup: {
          inline_keyboard: TelegramService.createLanguageKeyboard(),
        },
      })
      return NextResponse.json({ ok: true })
    }

    // Handle /help command
    if (text.startsWith('/help')) {
      await TelegramService.sendMessage(chatId, messages.help[userLang] || messages.help.en)
      return NextResponse.json({ ok: true })
    }

    // Handle /location command
    if (text.startsWith('/location')) {
      const parts = text.split(' ')
      if (parts.length < 2) {
        const msg = userLang === 'hi'
          ? '❌ कृपया एक शहर का नाम प्रदान करें। उदाहरण: /location Delhi'
          : '❌ Please provide a city name. Example: /location Delhi'
        await TelegramService.sendMessage(chatId, msg)
        return NextResponse.json({ ok: true })
      }

      const location = parts.slice(1).join(' ')
      TelegramService.setUserPreferences(chatId, { location })

      const msg = userLang === 'hi'
        ? `✅ स्थान सेट किया गया: ${location}\n\nअब /weather का उपयोग करके अपने क्षेत्र का मौसम देखें!`
        : `✅ Location set to: ${location}\n\nUse /weather to see your local weather!`

      await TelegramService.sendMessage(chatId, msg)
      return NextResponse.json({ ok: true })
    }

    // Handle /weather command
    if (text.startsWith('/weather')) {
      try {
        const prefs = TelegramService.getUserPreferences(chatId)
        const location = prefs.location || 'Delhi'

        const weather = await WeatherService.fetchWeather(location)

        await TelegramService.sendWeatherAlert(chatId, {
          location: weather.location.city,
          temp: weather.current.temp,
          humidity: weather.current.humidity,
          condition: weather.current.condition,
          rainChance: weather.forecast[0]?.precipitation || 0,
        }, userLang)
      } catch (error) {
        const msg = userLang === 'hi'
          ? '❌ मौसम डेटा प्राप्त करने में विफल। कृपया /location का उपयोग करके अपना स्थान सेट करें।'
          : '❌ Failed to fetch weather. Please set your location using /location'
        await TelegramService.sendMessage(chatId, msg)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle /market command
    if (text.startsWith('/market')) {
      try {
        const parts = text.split(' ')
        const cropQuery = parts.slice(1).join(' ')

        let prices
        if (cropQuery) {
          prices = await MarketService.searchPrices(cropQuery)
        } else {
          prices = await MarketService.fetchMarketPrices()
        }

        if (prices.length === 0) {
          const msg = userLang === 'hi'
            ? `❌ "${cropQuery}" के लिए कोई बाजार डेटा नहीं मिला।`
            : `❌ No market data found for "${cropQuery}".`
          await TelegramService.sendMessage(chatId, msg)
          return NextResponse.json({ ok: true })
        }

        await TelegramService.sendMarketPrices(chatId, prices, userLang)
      } catch (error) {
        const msg = userLang === 'hi'
          ? '❌ बाजार डेटा प्राप्त करने में विफल।'
          : '❌ Failed to fetch market data.'
        await TelegramService.sendMessage(chatId, msg)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle /msp command
    if (text.startsWith('/msp')) {
      const parts = text.split(' ')
      if (parts.length < 2) {
        const msg = userLang === 'hi'
          ? '❌ कृपया फसल का नाम प्रदान करें। उदाहरण: /msp wheat'
          : '❌ Please provide a crop name. Example: /msp wheat'
        await TelegramService.sendMessage(chatId, msg)
        return NextResponse.json({ ok: true })
      }

      const cropName = parts.slice(1).join(' ')
      const msp = MarketService.getMSP(cropName)

      if (!msp) {
        const msg = userLang === 'hi'
          ? `❌ "${cropName}" के लिए MSP डेटा उपलब्ध नहीं है।`
          : `❌ MSP data not available for "${cropName}".`
        await TelegramService.sendMessage(chatId, msg)
        return NextResponse.json({ ok: true })
      }

      const mspMsg = userLang === 'hi'
        ? `📊 <b>${cropName} के लिए MSP</b>\n\n💰 न्यूनतम समर्थन मूल्य: ₹${msp}/क्विंटल\n\n<i>यह सरकार द्वारा गारंटीकृत न्यूनतम मूल्य है।</i>`
        : `📊 <b>MSP for ${cropName}</b>\n\n💰 Minimum Support Price: ₹${msp}/quintal\n\n<i>This is the government-guaranteed minimum price.</i>`

      await TelegramService.sendMessage(chatId, mspMsg)
      return NextResponse.json({ ok: true })
    }

    // Handle /ask command (AI chat)
    if (text.startsWith('/ask')) {
      const question = text.replace('/ask', '').trim()

      if (!question) {
        const msg = userLang === 'hi'
          ? '❌ कृपया एक प्रश्न पूछें। उदाहरण: /ask गेहूं में जंग का इलाज कैसे करें?'
          : '❌ Please ask a question. Example: /ask How to treat wheat rust?'
        await TelegramService.sendMessage(chatId, msg)
        return NextResponse.json({ ok: true })
      }

      const thinkingMsg = userLang === 'hi' ? '🤔 सोच रहा हूं...' : '🤔 Thinking...'
      await TelegramService.sendMessage(chatId, thinkingMsg)

      try {
        const prefs = TelegramService.getUserPreferences(chatId)
        const response = await groqService.chat(
          [{ role: 'user', parts: [{ text: question }] }],
          userLang,
          prefs.location
        )

        await TelegramService.sendMessage(chatId, `🤖 <b>AI Response:</b>\n\n${response}`)
      } catch (error) {
        const msg = userLang === 'hi'
          ? '❌ AI प्रतिक्रिया प्राप्त करने में विफल। कृपया बाद में पुनः प्रयास करें।'
          : '❌ Failed to get AI response. Please try again later.'
        await TelegramService.sendMessage(chatId, msg)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle /diagnose command or photo upload
    if (text.startsWith('/diagnose') || message.photo) {
      if (!message.photo) {
        const msg = userLang === 'hi'
          ? '📸 कृपया निदान के लिए अपनी फसल या पौधे की एक तस्वीर भेजें।'
          : '📸 Please send a photo of your crop or plant for diagnosis.'
        await TelegramService.sendMessage(chatId, msg)
        return NextResponse.json({ ok: true })
      }

      const analyzingMsg = userLang === 'hi' ? '🔍 छवि का विश्लेषण कर रहा हूं...' : '🔍 Analyzing image...'
      await TelegramService.sendMessage(chatId, analyzingMsg)

      try {
        // Get the largest photo
        const photo = message.photo[message.photo.length - 1]
        const fileInfo = await TelegramService.getFile(photo.file_id)
        const fileBuffer = await TelegramService.downloadFile(fileInfo.result.file_path)

        // Convert to base64
        const base64Image = Buffer.from(fileBuffer).toString('base64')

        const prefs = TelegramService.getUserPreferences(chatId)
        const diagnosis = await groqService.analyzeCropImage(
          base64Image,
          'Analyze this crop/plant image and provide diagnosis',
          userLang,
          prefs.location
        )

        await TelegramService.sendMessage(chatId, `🌾 <b>Crop Diagnosis:</b>\n\n${diagnosis}`)
      } catch (error) {
        console.error('Image analysis error:', error)
        const msg = userLang === 'hi'
          ? '❌ छवि विश्लेषण विफल। कृपया एक स्पष्ट फसल/पौधे की तस्वीर भेजें।'
          : '❌ Image analysis failed. Please send a clear crop/plant photo.'
        await TelegramService.sendMessage(chatId, msg)
      }
      return NextResponse.json({ ok: true })
    }

    // Handle general messages (AI chat without /ask)
    if (text && !text.startsWith('/')) {
      const thinkingMsg = userLang === 'hi' ? '🤔 सोच रहा हूं...' : '🤔 Thinking...'
      await TelegramService.sendMessage(chatId, thinkingMsg)

      try {
        const prefs = TelegramService.getUserPreferences(chatId)
        const response = await groqService.chat(
          [{ role: 'user', parts: [{ text }] }],
          userLang,
          prefs.location
        )

        await TelegramService.sendMessage(chatId, response)
      } catch (error) {
        const msg = userLang === 'hi'
          ? '❌ प्रतिक्रिया प्राप्त करने में विफल। /help का उपयोग करके उपलब्ध कमांड देखें।'
          : '❌ Failed to get response. Use /help to see available commands.'
        await TelegramService.sendMessage(chatId, msg)
      }
      return NextResponse.json({ ok: true })
    }

    // Unknown command
    const msg = userLang === 'hi'
      ? '❓ अज्ञात कमांड। /help का उपयोग करके उपलब्ध कमांड देखें।'
      : '❓ Unknown command. Use /help to see available commands.'
    await TelegramService.sendMessage(chatId, msg)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('❌ Telegram webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Telegram webhook active',
    timestamp: new Date().toISOString(),
    bot: 'Kisan Mitra',
  })
}
