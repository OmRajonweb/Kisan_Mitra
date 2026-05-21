// lib/youtubeService.ts - LLM-powered YouTube video suggestions for Learn module
import type { Language } from './i18n'

export interface VideoSuggestion {
    title: string
    channel: string
    description: string
    searchQuery: string // Used to construct YouTube search URL
    views?: string
    duration?: string
}

interface VideoCache {
    videos: VideoSuggestion[]
    timestamp: number
    topic: string
    language: string
}

const CACHE_KEY_PREFIX = 'kisan_mitra_videos_'
const CACHE_DURATION_MS = 60 * 60 * 1000 // 1 hour cache

// Get cached videos for a topic
function getCachedVideos(topic: string, language: string): VideoSuggestion[] | null {
    if (typeof window === 'undefined') return null

    try {
        const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${topic}_${language}`)
        if (cached) {
            const data: VideoCache = JSON.parse(cached)
            if (Date.now() - data.timestamp < CACHE_DURATION_MS) {
                return data.videos
            }
        }
    } catch (e) {
        console.error('Error reading video cache:', e)
    }
    return null
}

// Save videos to cache
function cacheVideos(topic: string, language: string, videos: VideoSuggestion[]): void {
    if (typeof window === 'undefined') return

    try {
        const data: VideoCache = {
            videos,
            timestamp: Date.now(),
            topic,
            language
        }
        localStorage.setItem(`${CACHE_KEY_PREFIX}${topic}_${language}`, JSON.stringify(data))
    } catch (e) {
        console.error('Error caching videos:', e)
    }
}

// Generate YouTube search URL
export function getYouTubeSearchUrl(query: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}

// Generate YouTube video suggestions using LLM
export async function getVideoSuggestions(
    topic: string,
    category: string,
    language: Language = 'en'
): Promise<VideoSuggestion[]> {
    // Check cache first
    const cached = getCachedVideos(topic, language)
    if (cached) {
        console.log('📺 Using cached video suggestions for:', topic)
        return cached
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

    if (!apiKey) {
        console.warn('No OpenAI API key, using fallback video suggestions')
        return getFallbackVideos(topic, category, language)
    }

    // Map language code to full language name
    const languageNames: Record<Language, string> = {
        'en': 'English',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'te': 'Telugu',
        'mr': 'Marathi',
        'ta': 'Tamil',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'pa': 'Punjabi'
    }

    const langName = languageNames[language] || 'Hindi'

    const prompt = `Suggest 4 YouTube videos for Indian farmers learning about "${topic}" (Category: ${category}).

Return ONLY a JSON array, no markdown, no code blocks:
[
  {
    "title": "Exact or likely video title in ${langName}",
    "channel": "Popular Indian agriculture YouTube channel name",
    "description": "Brief 1-line description of what the video covers",
    "searchQuery": "YouTube search query to find this video in ${langName}",
    "duration": "Estimated duration like 10:30 or 15 min",
    "views": "Estimated views like 500K or 1.2M"
  }
]

Requirements:
- Prioritize popular Indian agriculture channels (like: Krishi Jagran, DD Kisan, Indian Farmer, Agriculture World, Farming Leader, etc.)
- Include government channels (ICAR, Krishi Vigyan Kendra) when relevant
- Videos should be in ${langName} language
- Focus on practical, actionable content
- Include a mix of beginner and advanced content
- searchQuery should be optimized to find the best video

Return ONLY the JSON array.`

    try {
        console.log('📺 Fetching video suggestions for:', topic)

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert on Indian agricultural education content on YouTube. Suggest real, popular videos from known agriculture channels. Return only valid JSON.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            })
        })

        if (!response.ok) {
            console.error('LLM API error:', response.status)
            return getFallbackVideos(topic, category, language)
        }

        const data = await response.json()
        const content = data.choices[0]?.message?.content || ''

        let videos: VideoSuggestion[]
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                videos = JSON.parse(jsonMatch[0])
            } else {
                videos = JSON.parse(content)
            }
        } catch (parseError) {
            console.error('Failed to parse LLM response:', parseError)
            return getFallbackVideos(topic, category, language)
        }

        // Validate and format videos
        const formattedVideos: VideoSuggestion[] = videos.map((video: any) => ({
            title: video.title || topic,
            channel: video.channel || 'Agriculture Channel',
            description: video.description || '',
            searchQuery: video.searchQuery || `${topic} farming India ${langName}`,
            duration: video.duration || '10:00',
            views: video.views || '100K'
        }))

        // Cache the results
        cacheVideos(topic, language, formattedVideos)

        console.log('✅ Generated', formattedVideos.length, 'video suggestions')
        return formattedVideos

    } catch (error) {
        console.error('Error fetching video suggestions:', error)
        return getFallbackVideos(topic, category, language)
    }
}

// Fallback videos when LLM is unavailable
function getFallbackVideos(topic: string, category: string, language: Language): VideoSuggestion[] {
    const langSuffix = language === 'hi' ? 'हिंदी में' : language === 'en' ? '' : 'in Hindi'

    // Topic-specific fallbacks
    const topicVideos: Record<string, VideoSuggestion[]> = {
        'wheatCultivation': [
            {
                title: `गेहूं की खेती कैसे करें | Complete Wheat Farming Guide`,
                channel: 'Krishi Jagran',
                description: 'Complete guide on wheat cultivation from sowing to harvesting',
                searchQuery: `wheat farming complete guide India ${langSuffix}`,
                duration: '15:30',
                views: '1.2M'
            },
            {
                title: 'Wheat Variety Selection - Best Varieties for Higher Yield',
                channel: 'ICAR Official',
                description: 'Government recommended wheat varieties for different regions',
                searchQuery: `best wheat varieties India ICAR ${langSuffix}`,
                duration: '12:00',
                views: '450K'
            },
            {
                title: 'गेहूं में सिंचाई कब और कैसे करें',
                channel: 'DD Kisan',
                description: 'Irrigation schedule and techniques for wheat crop',
                searchQuery: `wheat irrigation techniques India ${langSuffix}`,
                duration: '10:15',
                views: '780K'
            },
            {
                title: 'Wheat Fertilizer Management - NPK Application',
                channel: 'Agriculture World',
                description: 'Complete fertilizer guide for wheat farming',
                searchQuery: `wheat fertilizer npk dosage India ${langSuffix}`,
                duration: '8:45',
                views: '320K'
            }
        ],
        'organicPest': [
            {
                title: 'जैविक कीटनाशक घर पर बनाएं | Organic Pesticides at Home',
                channel: 'Organic Farming India',
                description: 'Make effective organic pesticides at home',
                searchQuery: `organic pesticide homemade India ${langSuffix}`,
                duration: '12:20',
                views: '890K'
            },
            {
                title: 'Neem Oil Spray - सबसे प्रभावी जैविक कीटनाशक',
                channel: 'Krishi Jagran',
                description: 'How to prepare and use neem oil spray effectively',
                searchQuery: `neem oil spray farming India ${langSuffix}`,
                duration: '9:30',
                views: '1.5M'
            },
            {
                title: 'IPM - Integrated Pest Management for Indian Farmers',
                channel: 'ICAR Official',
                description: 'Scientific approach to pest management',
                searchQuery: `integrated pest management India farmers ${langSuffix}`,
                duration: '18:00',
                views: '250K'
            },
            {
                title: 'Natural Pest Control Using Beneficial Insects',
                channel: 'Agriculture Technology',
                description: 'Using ladybugs and other beneficial insects',
                searchQuery: `beneficial insects pest control farming ${langSuffix}`,
                duration: '11:45',
                views: '180K'
            }
        ],
        'waterConservation': [
            {
                title: 'ड्रिप इरिगेशन कैसे लगाएं | Drip Irrigation Setup Guide',
                channel: 'Modern Farming',
                description: 'Complete guide to installing drip irrigation system',
                searchQuery: `drip irrigation installation India ${langSuffix}`,
                duration: '20:00',
                views: '2.1M'
            },
            {
                title: 'Rainwater Harvesting for Agriculture - Farm Pond',
                channel: 'DD Kisan',
                description: 'Building farm ponds for water conservation',
                searchQuery: `farm pond construction rainwater harvesting ${langSuffix}`,
                duration: '15:30',
                views: '650K'
            },
            {
                title: 'Mulching Techniques - Save 70% Water',
                channel: 'Agriculture World',
                description: 'Different mulching techniques for water conservation',
                searchQuery: `mulching techniques farming India ${langSuffix}`,
                duration: '10:00',
                views: '380K'
            },
            {
                title: 'Sprinkler Irrigation System Explained',
                channel: 'Krishi Gyan',
                description: 'Sprinkler system setup and benefits',
                searchQuery: `sprinkler irrigation system India ${langSuffix}`,
                duration: '12:30',
                views: '520K'
            }
        ],
        'msp': [
            {
                title: 'MSP क्या है? कैसे मिलता है? Complete Guide',
                channel: 'Krishi Jagran',
                description: 'Everything about Minimum Support Price in India',
                searchQuery: `MSP minimum support price explained India ${langSuffix}`,
                duration: '14:00',
                views: '1.8M'
            },
            {
                title: 'MSP 2024-25 - All Crops Price List',
                channel: 'DD Kisan',
                description: 'Latest MSP rates for all crops',
                searchQuery: `MSP rates 2024 all crops India ${langSuffix}`,
                duration: '10:00',
                views: '950K'
            },
            {
                title: 'How to Sell Crops at MSP - Step by Step',
                channel: 'Agriculture Economics',
                description: 'Process to sell your crops at MSP',
                searchQuery: `how to sell crops MSP mandi India ${langSuffix}`,
                duration: '12:30',
                views: '720K'
            },
            {
                title: 'MSP vs Market Price - When to Sell?',
                channel: 'Farming Leader',
                description: 'Smart selling strategies for farmers',
                searchQuery: `MSP market price comparison when to sell ${langSuffix}`,
                duration: '8:45',
                views: '340K'
            }
        ],
        'demandSupply': [
            {
                title: 'मंडी में अपनी फसल का सही दाम कैसे पाएं?',
                channel: 'Market Master',
                description: 'Understanding market demand and getting best prices',
                searchQuery: `mandi pricing tips farmers India ${langSuffix}`,
                duration: '15:00',
                views: '1.1M'
            },
            {
                title: 'Crop Price Forecasting - जानें कब बेचें फसल',
                channel: 'Agri Business',
                description: 'Predicting crop prices for better returns',
                searchQuery: `crop price prediction India farmers ${langSuffix}`,
                duration: '18:00',
                views: '580K'
            },
            {
                title: 'eNAM Registration and Trading - Complete Guide',
                channel: 'Digital Agriculture',
                description: 'Sell crops online through eNAM portal',
                searchQuery: `eNAM registration trading India ${langSuffix}`,
                duration: '12:00',
                views: '890K'
            },
            {
                title: 'Understanding Agricultural Market Trends',
                channel: 'Krishi Economics',
                description: 'Market analysis for smart farming decisions',
                searchQuery: `agricultural market trends India ${langSuffix}`,
                duration: '14:30',
                views: '280K'
            }
        ],
        'cropCycles': [
            {
                title: 'फसल चक्र क्यों जरूरी है? Crop Rotation Explained',
                channel: 'Scientific Farming',
                description: 'Benefits of crop rotation for soil health',
                searchQuery: `crop rotation benefits India ${langSuffix}`,
                duration: '11:00',
                views: '620K'
            },
            {
                title: 'Rabi-Kharif-Zaid - Complete Indian Farming Calendar',
                channel: 'Krishi Jagran',
                description: 'Season-wise crop planning guide',
                searchQuery: `rabi kharif crop calendar India ${langSuffix}`,
                duration: '16:00',
                views: '1.3M'
            },
            {
                title: 'Best Crop Combinations for Maximum Profit',
                channel: 'Farming Tips',
                description: 'Profitable crop rotation patterns',
                searchQuery: `crop combination profitable farming India ${langSuffix}`,
                duration: '13:30',
                views: '450K'
            },
            {
                title: 'Intercropping Techniques - Double Your Income',
                channel: 'Agriculture World',
                description: 'Growing multiple crops together effectively',
                searchQuery: `intercropping techniques India ${langSuffix}`,
                duration: '10:45',
                views: '780K'
            }
        ]
    }

    // Return topic-specific videos or generic farming videos
    return topicVideos[topic] || [
        {
            title: `${topic} - Complete Guide for Indian Farmers`,
            channel: 'Krishi Jagran',
            description: `Learn everything about ${topic}`,
            searchQuery: `${topic} farming guide India ${langSuffix}`,
            duration: '15:00',
            views: '500K'
        },
        {
            title: `${topic} - Expert Tips and Techniques`,
            channel: 'DD Kisan',
            description: `Expert advice on ${topic}`,
            searchQuery: `${topic} expert tips Indian farmers ${langSuffix}`,
            duration: '12:00',
            views: '300K'
        },
        {
            title: `${topic} - Government Recommendations`,
            channel: 'ICAR Official',
            description: `Official guidelines on ${topic}`,
            searchQuery: `${topic} ICAR recommendations India ${langSuffix}`,
            duration: '10:00',
            views: '200K'
        },
        {
            title: `${topic} - Success Stories`,
            channel: 'Farming Success',
            description: `Real farmer success stories with ${topic}`,
            searchQuery: `${topic} success story Indian farmer ${langSuffix}`,
            duration: '8:00',
            views: '400K'
        }
    ]
}

// Clear video cache
export function clearVideoCache(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
            localStorage.removeItem(key)
        }
    })
}
