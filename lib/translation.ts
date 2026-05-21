// lib/translation.ts - Translation service using Bhashini/Google Translate
export interface TranslationResult {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
}

export class TranslationService {
  // Supported Indic languages
  static readonly LANGUAGES = {
    en: 'English',
    hi: 'Hindi',
    bn: 'Bengali',
    te: 'Telugu',
    mr: 'Marathi',
    ta: 'Tamil',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
    or: 'Odia',
  }

  // Try Bhashini first (Government API), fallback to Google
  static async translate(
    text: string,
    targetLang: string,
    sourceLang: string = 'auto'
  ): Promise<TranslationResult> {
    try {
      // Try Bhashini API (AI4Bharat)
      const bhashiniKey = process.env.NEXT_PUBLIC_BHASHINI_API_KEY
      const bhashiniUserId = process.env.NEXT_PUBLIC_BHASHINI_USER_ID

      if (bhashiniKey && bhashiniUserId) {
        return await this.translateWithBhashini(text, targetLang, sourceLang)
      }

      // Fallback to Google Cloud Translation
      const googleKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY
      if (googleKey) {
        return await this.translateWithGoogle(text, targetLang, sourceLang)
      }

      throw new Error('No translation API key configured')
    } catch (error) {
      console.error('Translation failed:', error)
      // Return original text if translation fails
      return {
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      }
    }
  }

  // Bhashini API (Government - AI4Bharat)
  private static async translateWithBhashini(
    text: string,
    targetLang: string,
    sourceLang: string
  ): Promise<TranslationResult> {
    const apiKey = process.env.NEXT_PUBLIC_BHASHINI_API_KEY
    const userId = process.env.NEXT_PUBLIC_BHASHINI_USER_ID

    const response = await fetch('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey!,
        'ulca-api-user-id': userId!,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'translation',
            config: {
              language: {
                sourceLanguage: sourceLang === 'auto' ? 'en' : sourceLang,
                targetLanguage: targetLang,
              },
            },
          },
        ],
        inputData: {
          input: [{ source: text }],
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Bhashini API request failed')
    }

    const data = await response.json()
    const translatedText = data.pipelineResponse[0].output[0].target

    return {
      translatedText,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
    }
  }

  // Google Cloud Translation API
  private static async translateWithGoogle(
    text: string,
    targetLang: string,
    sourceLang: string
  ): Promise<TranslationResult> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`

    const params: any = {
      q: text,
      target: targetLang,
    }

    if (sourceLang !== 'auto') {
      params.source = sourceLang
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error('Google Translation API request failed')
    }

    const data = await response.json()
    const translatedText = data.data.translations[0].translatedText
    const detectedSourceLang = data.data.translations[0].detectedSourceLanguage || sourceLang

    return {
      translatedText,
      sourceLanguage: detectedSourceLang,
      targetLanguage: targetLang,
    }
  }

  // Detect language
  static async detectLanguage(text: string): Promise<string> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY
      if (!apiKey) return 'en'

      const url = `https://translation.googleapis.com/language/translate/v2/detect?key=${apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: text }),
      })

      if (!response.ok) return 'en'

      const data = await response.json()
      return data.data.detections[0][0].language
    } catch (error) {
      console.error('Language detection failed:', error)
      return 'en'
    }
  }

  // Translate to farmer's preferred language
  static async translateToUserLanguage(
    text: string,
    userLanguage: string = 'hi'
  ): Promise<string> {
    if (userLanguage === 'en') return text

    const result = await this.translate(text, userLanguage, 'en')
    return result.translatedText
  }

  // Batch translation for multiple texts
  static async translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string = 'auto'
  ): Promise<string[]> {
    const promises = texts.map((text) => this.translate(text, targetLang, sourceLang))
    const results = await Promise.all(promises)
    return results.map((r) => r.translatedText)
  }
}
