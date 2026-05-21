// lib/gemini.ts - Gemini AI Integration
export interface GeminiMessage {
  role: 'user' | 'model'
  parts: { text: string }[]
}

export class GeminiService {
  private apiKeys: string[] = []
  private model: string = 'gemini-2.5-flash-lite'
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models'

  constructor() {
    const key1 = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
    const key2 = process.env.NEXT_PUBLIC_GEMINI_API_KEY_2 || ''

    if (key1) this.apiKeys.push(key1)
    if (key2) this.apiKeys.push(key2)
  }

  private getRandomKey(): string {
    if (this.apiKeys.length === 0) return ''
    const key = this.apiKeys[Math.floor(Math.random() * this.apiKeys.length)]
    console.log('Using Gemini Key:', key.substring(0, 8) + '...')
    return key
  }

  async chat(messages: GeminiMessage[], language: string = 'en'): Promise<string> {
    const apiKey = this.getRandomKey()
    if (!apiKey) {
      return 'Please configure your Gemini API key in .env.local file.'
    }

    // Create system message as the first message
    const systemMessage: GeminiMessage = {
      role: 'user',
      parts: [{
        text: `You are Kisan Mitra (किसान मित्र), an AI farming assistant for Indian farmers. Help with agriculture, crops, weather, and market prices. Respond in ${language} language with practical farming advice.`
      }]
    }

    const systemResponse: GeminiMessage = {
      role: 'model',
      parts: [{
        text: `Namaste! I am Kisan Mitra, your farming assistant. I can help you with crops, weather, market prices, and farming advice in ${language}. How can I help you today?`
      }]
    }

    // Combine system messages with user messages
    const allMessages = messages.length > 0 && messages[0].role === 'user'
      ? [systemMessage, systemResponse, ...messages]
      : messages

    try {
      const requestBody = {
        contents: allMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }

      console.log('*** USING MODEL:', this.model, '***')
      console.log('Gemini API Request:', {
        url: `${this.baseUrl}/${this.model}:generateContent`,
        model: this.model,
        messageCount: allMessages.length
      })

      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || 'No response generated.'
    } catch (error) {
      console.error('Gemini API error:', error)
      return 'Sorry, I encountered an error. Please try again later.'
    }
  }

  async analyzeCropImage(imageBase64: string, question: string): Promise<string> {
    const apiKey = this.getRandomKey()
    if (!apiKey) {
      return 'Please configure your Gemini API key in .env.local file.'
    }

    const systemPrompt = `You are an expert agricultural pathologist and crop advisor for Indian farmers. 
    
Analyze this crop/plant image and provide:
1. Crop identification (if visible)
2. Disease/pest detection (if any)
3. Health assessment
4. Treatment recommendations (organic and chemical options)
5. Prevention tips

ONLY discuss agriculture. If the image is not related to farming/crops, say: "This doesn't appear to be a crop or plant. Please upload an image of your crop or plant for diagnosis."

Be practical and specific for Indian farming conditions.`

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt + '\n\n' + question },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates[0]?.content?.parts[0]?.text || 'Unable to analyze the image.'
    } catch (error) {
      console.error('Image analysis error:', error)
      return 'Sorry, I could not analyze the image. Please try again.'
    }
  }

  async getCropRecommendation(
    soilType: string,
    location: string,
    season: string
  ): Promise<string> {
    const prompt = `You are an expert agricultural advisor for Indian farmers.

Based on these farming conditions in India:
- Soil Type: ${soilType}
- Location: ${location}
- Season: ${season}

Recommend the 3-4 BEST crops to grow with:
1. Crop name (in English and Hindi if possible)
2. Expected yield per acre
3. Water requirements
4. Ideal growing conditions
5. Market potential and selling price
6. Growing duration
7. Initial investment needed

Focus on crops suitable for Indian climate and profitable in Indian markets.
Provide practical, actionable advice for Indian farmers.`

    return this.chat([
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ])
  }
}
