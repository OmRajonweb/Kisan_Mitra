// lib/market-distance.ts - AI-powered distance calculation using Groq
import { getUserLocationData } from './geolocation'
import type { MarketPrice } from './market'

/**
 * Calculate distances for market prices using AI
 * INSTANT and works for ANY city in India!
 */
export async function calculateMarketDistances(prices: MarketPrice[]): Promise<MarketPrice[]> {
    try {
        // Get user's location
        const userLocation = await getUserLocationData()
        if (!userLocation) {
            console.warn('Could not get user location, using default distances')
            return prices
        }

        console.log('📍 Calculating distances from:', userLocation.city)

        // Extract unique market cities
        const marketCities = [...new Set(prices.map(p => {
            // Extract city name from market (e.g., "Sendhwa APMC" -> "Sendhwa")
            return p.market.replace(/\s+(APMC|Mandi|Market|Sabzi Mandi)$/i, '').trim()
        }))]

        // Ask AI for all distances in one shot (FAST!)
        const prompt = `Calculate approximate road distance in kilometers from ${userLocation.city}, India to each of these Indian cities. Return ONLY a JSON object like {"City1": 100, "City2": 200}. Cities: ${marketCities.join(', ')}`

        console.log('🤖 Asking AI for distances...')

        // Use fetch directly to call Groq API
        const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1
            })
        })

        const data = await response.json()
        const aiResponse = data.choices?.[0]?.message?.content || '{}'

        // Parse AI response
        let distances: { [city: string]: number } = {}
        try {
            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/)
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0])
                // Normalize to lowercase
                Object.keys(parsed).forEach(key => {
                    distances[key.toLowerCase()] = parseInt(parsed[key]) || 50
                })
                console.log('✅ Got distances from AI:', distances)
            }
        } catch (e) {
            console.warn('Failed to parse AI response:', aiResponse)
        }

        // Apply distances to prices
        const pricesWithDistances: MarketPrice[] = prices.map(price => {
            const cityName = price.market.replace(/\s+(APMC|Mandi|Market|Sabzi Mandi)$/i, '').trim().toLowerCase()
            const distance = distances[cityName] || 50

            console.log(`✅ ${price.market}: ${distance} km`)
            return { ...price, distance }
        })

        return pricesWithDistances
    } catch (error) {
        console.error('❌ Error calculating distances:', error)
        // Fallback to simple estimates
        return prices.map(p => ({
            ...p,
            distance: p.market.toLowerCase().includes('local') ? 15 : 50
        }))
    }
}
