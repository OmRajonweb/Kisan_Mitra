// lib/openai.ts - OpenAI Integration
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface VisionMessage {
    role: 'user'
    content: (
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
    )[]
}

export class OpenAIService {
    private apiKey: string
    private model: string = 'gpt-4o-mini'
    private baseUrl: string = 'https://api.openai.com/v1/chat/completions'

    constructor() {
        this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
    }

    async chat(messages: { role: string; parts: { text: string }[] }[], language: string = 'en'): Promise<string> {
        if (!this.apiKey) {
            return 'Please configure your OpenAI API key in .env.local file.'
        }

        // Adapt Gemini-style messages to OpenAI format
        const openAIMessages: ChatMessage[] = [
            {
                role: 'system',
                content: `You are Kisan Mitra (किसान मित्र), an AI farming assistant for Indian farmers. Help with agriculture, crops, weather, and market prices. Respond in ${language} language with practical farming advice.`
            },
            ...messages.map(msg => ({
                role: (msg.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
                content: msg.parts[0]?.text || ''
            }))
        ]

        try {
            console.log('*** USING MODEL:', this.model, '***')

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: openAIMessages,
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('OpenAI API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                })
                throw new Error(`API error: ${response.status} - ${errorText}`)
            }

            const data = await response.json()
            return data.choices[0]?.message?.content || 'No response generated.'
        } catch (error) {
            console.error('OpenAI API error:', error)
            return 'Sorry, I encountered an error. Please try again later.'
        }
    }

    async analyzeCropImage(imageBase64: string, question: string): Promise<string> {
        if (!this.apiKey) {
            return 'Please configure your OpenAI API key in .env.local file.'
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
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
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
                    max_tokens: 2048,
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

        // Reuse chat method
        return this.chat([
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ])
    }
}
