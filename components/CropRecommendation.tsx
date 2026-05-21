import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sprout, Loader2, CheckCircle, MapPin, Droplets, TrendingUp, Calendar, IndianRupee, ThermometerSun } from 'lucide-react'
import { GroqService } from '@/lib/groq'
import { storage } from '@/lib/storage'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'

interface RecommendationResult {
  crop_name: string
  yield: string
  water: string
  conditions: string
  market: string
  duration: string
  investment: string
}

export default function CropRecommendation() {
  const [formData, setFormData] = useState({
    soilType: '',
    location: storage.getUser()?.location || '',
    season: '',
    waterAvailability: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [recommendations, setRecommendations] = useState<RecommendationResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const groq = new GroqService()

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const soilTypes = [
    { key: 'loamy', label: getTranslation('cropRecommendation.loamy', currentLang) },
    { key: 'clay', label: getTranslation('cropRecommendation.clay', currentLang) },
    { key: 'sandy', label: getTranslation('cropRecommendation.sandy', currentLang) },
    { key: 'silt', label: getTranslation('cropRecommendation.silt', currentLang) },
    { key: 'redSoil', label: getTranslation('cropRecommendation.redSoil', currentLang) },
    { key: 'blackSoil', label: getTranslation('cropRecommendation.blackSoil', currentLang) },
    { key: 'alluvial', label: getTranslation('cropRecommendation.alluvial', currentLang) },
  ]
  const seasons = [
    { key: 'kharif', label: getTranslation('cropRecommendation.kharif', currentLang) },
    { key: 'rabi', label: getTranslation('cropRecommendation.rabi', currentLang) },
    { key: 'zaid', label: getTranslation('cropRecommendation.zaid', currentLang) },
  ]
  const waterLevels = [
    { key: 'abundant', label: getTranslation('cropRecommendation.abundant', currentLang) },
    { key: 'moderate', label: getTranslation('cropRecommendation.moderate', currentLang) },
    { key: 'limited', label: getTranslation('cropRecommendation.limited', currentLang) },
    { key: 'rainDependent', label: getTranslation('cropRecommendation.rainDependent', currentLang) },
  ]

  const handleGenerate = async () => {
    if (!formData.soilType || !formData.location || !formData.season) {
      alert(getTranslation('cropRecommendation.fillRequiredFields', currentLang))
      return
    }

    setIsGenerating(true)
    setRecommendations(null)
    setError(null)

    try {
      const response = await groq.getCropRecommendation(
        formData.soilType,
        formData.location,
        `${formData.season} with ${formData.waterAvailability} water availability`,
        currentLang
      )

      try {
        // First try parsing as JSON
        const jsonStart = response.indexOf('[')
        const jsonEnd = response.lastIndexOf(']') + 1
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = response.substring(jsonStart, jsonEnd)
          const parsed = JSON.parse(jsonStr)
          setRecommendations(parsed)
        } else {
          throw new Error("No JSON found")
        }
      } catch (e) {
        console.log("JSON parsing failed, falling back to Markdown parser", e)
        setRecommendations(parseMarkdownResponse(response))
      }

    } catch (error) {
      console.error('Recommendation error:', error)
      setError(getTranslation('cropRecommendation.errorMessage', currentLang))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Sprout className="text-green-600" size={36} />
          {getTranslation('cropRecommendation.title', currentLang)}
        </h2>
        <p className="text-gray-600 text-lg mt-2">
          {getTranslation('cropRecommendation.description', currentLang)}
        </p>
      </div>

      <div className="glass-effect rounded-3xl p-6 shadow-xl space-y-6">
        {/* Form Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              <Droplets className="inline mr-2" size={24} />
              {getTranslation('cropRecommendation.soilType', currentLang)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {soilTypes.map((type) => (
                <motion.button
                  key={type.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, soilType: type.label })}
                  className={`py-4 px-4 rounded-2xl font-semibold transition-all ${formData.soilType === type.label
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              <MapPin className="inline mr-2" size={24} />
              {getTranslation('cropRecommendation.location', currentLang)}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={getTranslation('cropRecommendation.locationPlaceholder', currentLang)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              {getTranslation('cropRecommendation.season', currentLang)}
            </label>
            <div className="space-y-3">
              {seasons.map((season) => (
                <motion.button
                  key={season.key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, season: season.label })}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-left transition-all ${formData.season === season.label
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}
                >
                  {season.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">
              {getTranslation('cropRecommendation.waterAvailability', currentLang)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {waterLevels.map((level) => (
                <motion.button
                  key={level.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, waterAvailability: level.label })}
                  className={`py-4 px-4 rounded-2xl font-semibold transition-all ${formData.waterAvailability === level.label
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                    }`}
                >
                  {level.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!recommendations && !isGenerating && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleGenerate}
            className="w-full btn-primary py-6 text-xl"
          >
            {getTranslation('cropRecommendation.generateRecommendations', currentLang)}
          </motion.button>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="animate-spin text-green-600" size={56} />
            <p className="text-xl font-semibold text-gray-700">
              {getTranslation('cropRecommendation.analyzing', currentLang)}
            </p>
            <p className="text-sm text-gray-600">
              {getTranslation('cropRecommendation.gettingRecommendations', currentLang)}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Results */}
        {recommendations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 text-green-600 font-bold text-xl px-2">
              <CheckCircle size={28} />
              {getTranslation('cropRecommendation.recommendationsReady', currentLang)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((crop, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-2xl p-5 border-2 border-green-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="text-xl font-bold text-green-800 mb-3 border-b pb-2">{crop.crop_name}</h3>

                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <TrendingUp size={18} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">{getTranslation('cropRecommendation.yieldLabel', currentLang)}</span>
                        {crop.yield}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Droplets size={18} className="text-cyan-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">{getTranslation('cropRecommendation.waterLabel', currentLang)}</span>
                        {crop.water}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <IndianRupee size={18} className="text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">{getTranslation('cropRecommendation.marketLabel', currentLang)}</span>
                        {crop.market}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar size={18} className="text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">{getTranslation('cropRecommendation.durationLabel', currentLang)}</span>
                        {crop.duration}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ThermometerSun size={18} className="text-orange-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold block">{getTranslation('cropRecommendation.conditionsLabel', currentLang)}</span>
                        {crop.conditions}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t text-xs text-gray-500 italic">
                      {getTranslation('cropRecommendation.investmentLabel', currentLang)} {crop.investment}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setRecommendations(null)
                  setFormData({
                    soilType: '',
                    location: storage.getUser()?.location || '',
                    season: '',
                    waterAvailability: '',
                  })
                }}
                className="flex-1 btn-secondary py-5 text-lg"
              >
                {getTranslation('cropRecommendation.newSearch', currentLang)}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const shareText = recommendations.map(c =>
                    `${c.crop_name}\nYield: ${c.yield}\nMarket: ${c.market}`
                  ).join('\n---\n')

                  navigator.share?.({
                    title: getTranslation('cropRecommendation.shareTitle', currentLang),
                    text: shareText,
                  })
                }}
                className="flex-1 btn-primary py-5 text-lg"
              >
                {getTranslation('cropRecommendation.share', currentLang)}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function parseMarkdownResponse(text: string): RecommendationResult[] {
  const crops: RecommendationResult[] = []

  // Clean the text first
  const cleanText = text.replace(/\*\*/g, '').replace(/###/g, '')

  // Split by numbered items (e.g., "1. Wheat", "2. Rice")
  // We look for a number followed by a dot at the start of a line
  const parts = cleanText.split(/(?=\n\d+\.\s+)/).filter(p => p.trim().length > 20)

  parts.forEach(part => {
    // Extract the first line as the name (removing the number "1. ")
    const lines = part.trim().split('\n')
    const firstLine = lines[0].replace(/^\d+\.\s*/, '').trim()

    // If the first line is too long, it might not be a name, defaulting to "Crop"
    const name = firstLine.length < 50 ? firstLine : 'Suggested Crop'

    const getVal = (keywords: string[]) => {
      for (const keyword of keywords) {
        // Look for "Keyword: Value" pattern
        const regex = new RegExp(`${keyword}[:\\-]\\s*(.*?)(?=\\n|$)`, 'i')
        const match = part.match(regex)
        if (match) return match[1].trim()
      }
      return 'Refer to description'
    }

    // Don't add if it doesn't look like a crop section
    if (lines.length > 1) {
      crops.push({
        crop_name: name,
        yield: getVal(['Yield', 'Expected yield', 'Production']),
        water: getVal(['Water', 'Water requirements', 'Irrigation']),
        conditions: getVal(['Conditions', 'Ideal growing conditions', 'Climate', 'Soil']),
        market: getVal(['Market', 'Market potential', 'Price', 'Selling price']),
        duration: getVal(['Duration', 'Growing duration', 'Time']),
        investment: getVal(['Investment', 'Cost', 'Initial investment'])
      })
    }
  })

  // Fallback if split failed (e.g. no numbered list)
  if (crops.length === 0) {
    return [{
      crop_name: "Recommendation Details",
      yield: "See below",
      water: "See below",
      conditions: text.slice(0, 100) + "...", // Show partial text context
      market: "See below",
      duration: "See below",
      investment: "See below"
    }]
  }

  return crops
}
