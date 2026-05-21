// lib/groq.ts - Groq Integration (Free & Fast)
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export class GroqService {
    private apiKey: string
    private textModel: string = 'llama-3.3-70b-versatile'
    private visionModel: string = 'meta-llama/llama-4-maverick-17b-128e-instruct'
    private baseUrl: string = 'https://api.groq.com/openai/v1/chat/completions'

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || ''
    }

    // Helper to adapt Gemini-style messages
    private adaptMessages(messages: { role: string; parts: { text: string }[] }[], language: string, location?: string): ChatMessage[] {
        let systemContent = `You are Kisan Mitra (किसान मित्र), an AI farming assistant for Indian farmers. Help with agriculture, crops, weather, and market prices. Respond in ${language} language with practical farming advice.`

        if (location) {
            systemContent += ` The farmer is located in ${location}. Provide advice relevant to this region's soil, climate, and farming practices.`
        }

        return [
            {
                role: 'system',
                content: systemContent
            },
            ...messages.map(msg => ({
                role: (msg.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
                content: msg.parts[0]?.text || ''
            }))
        ]
    }

    async chat(messages: { role: string; parts: { text: string }[] }[], language: string = 'en', location?: string): Promise<string> {
        if (!this.apiKey) {
            return 'Please configure your Groq API key in .env.local file.'
        }

        const groqMessages = this.adaptMessages(messages, language, location)

        try {
            console.log('*** USING GROQ MODEL:', this.textModel, '***')

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.textModel,
                    messages: groqMessages,
                    temperature: 0.6,
                    max_tokens: 1024,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Groq API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                })
                throw new Error(`API error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            return data.choices[0]?.message?.content || 'No response generated.'
        } catch (error) {
            console.error('Groq API error:', error)
            return 'Sorry, I encountered an error. Please try again later.'
        }
    }

    async analyzeCropImage(imageBase64: string, question: string, language: string = 'en', location?: string): Promise<string> {
        if (!this.apiKey) {
            return 'Please configure your Groq API key in .env.local file.'
        }

        let systemPrompt = `You are an expert agricultural pathologist and crop advisor for Indian farmers. 
    
Analyze this crop/plant image and provide:
1. Crop identification (if visible)
2. Disease/pest detection (if any)
3. Health assessment
4. Treatment recommendations (organic and chemical options)
5. Prevention tips

ONLY discuss agriculture. If the image is not related to farming/crops, say: "This doesn't appear to be a crop or plant. Please upload an image of your crop or plant for diagnosis."

Be practical and specific for Indian farming conditions.`

        systemPrompt += `\n\nIMPORTANT: Respond in ${language} language.`

        if (location) {
            systemPrompt += `\nContext: The farm is located in ${location}. Consider local conditions.`
        }

        try {
            console.log('*** USING GROQ VISION MODEL:', this.visionModel, '***')

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.visionModel,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: [
                                { type: 'text', text: question },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${imageBase64}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 1024,
                }),
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            const data = await response.json()
            return data.choices[0]?.message?.content || 'Unable to analyze the image.'
        } catch (error) {
            console.error('Image analysis error:', error)
            return 'Sorry, I could not analyze the image. Please try again.'
        }
    }

    async getCropRecommendation(
        soilType: string,
        location: string,
        season: string,
        language: string = 'en'
    ): Promise<string> {
        const prompt = `You are an expert agricultural advisor for Indian farmers.

Based on these farming conditions in India:
- Soil Type: ${soilType}
- Location: ${location}
- Season: ${season}

Recommend the 3-4 BEST crops to grow.

IMPORTANT: Return the response in STRICT JSON format only. Do not add any conversational text.
Respond in ${language} language. 
CRITICAL: Translate ALL values in the JSON to ${language} (except numbers/units if common).
The output should be an array of objects with this structure:
[
  {
    "crop_name": "Name (in ${language})",
    "yield": "Yield (in ${language})",
    "water": "Water info (in ${language})",
    "conditions": "Conditions (in ${language})",
    "market": "Market info (in ${language})",
    "duration": "Duration (in ${language})",
    "investment": "Investment (in ${language})"
  },
  ...
]

Focus on crops suitable for Indian climate and profitable in Indian markets.`

        // Reuse chat method
        return this.chat([
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ], language)
    }
}
