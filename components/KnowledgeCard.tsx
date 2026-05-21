'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Play, FileText, Video, ArrowRight, X, IndianRupee, TrendingUp, RefreshCw, Search, Youtube, ExternalLink, Clock, Eye } from 'lucide-react'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'
import SimpleMarkdown from './SimpleMarkdown'
import { getVideoSuggestions, getYouTubeSearchUrl, type VideoSuggestion } from '@/lib/youtubeService'

interface KnowledgeCardProps {
  fullView?: boolean
  onOpenAI?: () => void
}

export default function KnowledgeCard({ fullView = false, onOpenAI }: KnowledgeCardProps) {
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [videoSuggestions, setVideoSuggestions] = useState<VideoSuggestion[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [showVideos, setShowVideos] = useState(false)

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const getLocalizedArticles = () => [
    {
      key: 'wheatCultivation',
      title: getTranslation('knowledgeCard.articles.wheatCultivation.title', currentLang),
      category: getTranslation('knowledgeCard.articles.wheatCultivation.category', currentLang),
      duration: getTranslation('knowledgeCard.articles.wheatCultivation.duration', currentLang),
      icon: FileText,
      color: 'from-yellow-400 to-orange-500',
      content: `# ${getTranslation('knowledgeCard.articles.wheatCultivation.title', currentLang)}

## Soil Preparation
- Plow the field 2-3 times before sowing
- Add organic manure (10-15 tons/hectare)
- Maintain pH level between 6.0-7.5

## Sowing
- Best time: Mid-November to December
- Seed rate: 100-125 kg/hectare
- Row spacing: 20-23 cm

## Irrigation
- First irrigation: 20-25 days after sowing
- Subsequent irrigations every 20-25 days
- Total 5-6 irrigations needed

## Fertilizer
- Nitrogen: 120-150 kg/hectare
- Phosphorus: 60 kg/hectare
- Potassium: 40 kg/hectare

## Harvesting
- Harvest when grain moisture is 20-25%
- Usually 130-150 days after sowing`
    },
    {
      key: 'organicPest',
      title: getTranslation('knowledgeCard.articles.organicPest.title', currentLang),
      category: getTranslation('knowledgeCard.articles.organicPest.category', currentLang),
      duration: getTranslation('knowledgeCard.articles.organicPest.duration', currentLang),
      icon: FileText,
      color: 'from-green-400 to-emerald-500',
      content: `# ${getTranslation('knowledgeCard.articles.organicPest.title', currentLang)}

## Neem-Based Solutions
- Neem oil spray: 5ml per liter of water
- Spray every 7-10 days
- Effective against aphids, whiteflies

## Natural Predators
- Ladybugs: Control aphids
- Praying mantis: Control caterpillars
- Lacewings: Control soft-bodied insects

## Home Remedies
### Garlic Spray
- Crush 100g garlic in 1L water
- Let sit for 24 hours
- Spray on affected plants

### Soap Solution
- Mix 1 tbsp dish soap in 1L water
- Spray directly on pests
- Safe for most plants

## Prevention
- Crop rotation
- Companion planting
- Proper spacing
- Regular inspection`
    },
    {
      key: 'waterConservation',
      title: getTranslation('knowledgeCard.articles.waterConservation.title', currentLang),
      category: getTranslation('knowledgeCard.articles.waterConservation.category', currentLang),
      duration: getTranslation('knowledgeCard.articles.waterConservation.duration', currentLang),
      icon: Video,
      color: 'from-blue-400 to-cyan-500',
      content: `# ${getTranslation('knowledgeCard.articles.waterConservation.title', currentLang)}

## Drip Irrigation
- Saves 30-70% water vs flood irrigation
- Delivers water directly to roots
- Reduces evaporation
- Installation cost: ₹25,000-50,000/acre

## Mulching
- Cover soil with organic material
- Reduces evaporation by 70%
- Materials: straw, leaves, grass clippings
- 5-10 cm thick layer recommended

## Rainwater Harvesting
- Build farm ponds
- Store monsoon water
- Use for dry season irrigation
- Government subsidies available

## Scheduling
- Irrigate early morning or evening
- Avoid midday watering
- Use soil moisture sensors
- Water deeply, less frequently

## Crop Selection
- Choose drought-resistant varieties
- Practice crop rotation
- Use cover crops`
    },
    // Economics & Market Articles
    {
      key: 'msp',
      title: getTranslation('knowledgeCard.articles.msp.title', currentLang),
      category: getTranslation('knowledgeCard.articles.msp.category', currentLang),
      duration: getTranslation('knowledgeCard.articles.msp.duration', currentLang),
      icon: IndianRupee,
      color: 'from-purple-500 to-indigo-600',
      content: getTranslation('knowledgeCard.articles.msp.content', currentLang)
    },
    {
      key: 'demandSupply',
      title: getTranslation('knowledgeCard.articles.demandSupply.title', currentLang),
      category: getTranslation('knowledgeCard.articles.demandSupply.category', currentLang),
      duration: getTranslation('knowledgeCard.articles.demandSupply.duration', currentLang),
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-600',
      content: getTranslation('knowledgeCard.articles.demandSupply.content', currentLang)
    },
    {
      key: 'cropCycles',
      title: getTranslation('knowledgeCard.articles.cropCycles.title', currentLang),
      category: getTranslation('knowledgeCard.articles.cropCycles.category', currentLang),
      duration: getTranslation('knowledgeCard.articles.cropCycles.duration', currentLang),
      icon: RefreshCw,
      color: 'from-orange-400 to-red-500',
      content: getTranslation('knowledgeCard.articles.cropCycles.content', currentLang)
    },
  ]

  const articles = getLocalizedArticles()

  const categories = useMemo(() => {
    const cats = Array.from(new Set(articles.map(a => a.category)))
    return ['All', ...cats]
  }, [articles])

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory, articles])

  const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null)

  // Fetch video suggestions when an article is selected
  const fetchVideos = useCallback(async (articleKey: string, category: string) => {
    setLoadingVideos(true)
    setVideoSuggestions([])
    try {
      const videos = await getVideoSuggestions(articleKey, category, currentLang)
      setVideoSuggestions(videos)
    } catch (error) {
      console.error('Error fetching videos:', error)
      setVideoSuggestions([])
    }
    setLoadingVideos(false)
  }, [currentLang])

  // Handle article selection
  const handleArticleSelect = (article: typeof articles[0]) => {
    setSelectedArticle(article)
    setShowVideos(false)
    fetchVideos(article.key, article.category)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: fullView ? 0 : 0.6 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
          <BookOpen className="text-indigo-600" size={32} />
          {getTranslation('dashboard.learnAndGrow', currentLang)}
        </h3>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={getTranslation('crops.searchCrops', currentLang)} // Reusing 'Search...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="glass-effect rounded-3xl p-4 md:p-6 shadow-xl dark:bg-gray-800/80 dark:border dark:border-gray-700">

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              aria-pressed={selectedCategory === cat}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {cat === 'All' ? getTranslation('knowledgeCard.viewAll', currentLang) : cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode='popLayout'>
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article, index) => {
                const IconComponent = article.icon
                return (
                  <motion.div
                    layout
                    key={article.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleArticleSelect(article)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedArticle(article)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${article.title}, ${article.category}`}
                    className="bg-white dark:bg-gray-800/80 rounded-2xl p-5 shadow-md border-2 border-gray-100 dark:border-gray-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-400 transition-all hover:-translate-y-1 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${article.color} rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <IconComponent size={24} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {article.category}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-1 truncate leading-tight">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.duration}</span>
                        </div>
                      </div>
                      <ArrowRight className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors self-center" size={20} />
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <div className="col-span-full py-10 text-center text-gray-500 dark:text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p>No articles found for &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-shadow"
        >
          <Play size={20} />
          {getTranslation('knowledgeCard.startLearning', currentLang)}
        </motion.button>
      </div>

      {/* AI Assistant CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 glass-effect rounded-3xl p-6 shadow-xl text-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 dark:border dark:border-gray-700"
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-4xl">🤖</span>
          <div className="text-left">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {getTranslation('knowledgeCard.askAI', currentLang)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {getTranslation('knowledgeCard.instantAnswers', currentLang)}
            </p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenAI}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          {getTranslation('knowledgeCard.chatWithAI', currentLang)}
        </motion.button>
      </motion.div>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50 rounded-t-3xl">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${selectedArticle.color} rounded-xl flex items-center justify-center shadow-sm`}>
                    <selectedArticle.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      {selectedArticle.category}
                    </span>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight mt-1">
                      {selectedArticle.title}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  aria-label={getTranslation('common.close', currentLang)}
                  className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                {/* Article Content */}
                {!showVideos && (
                  <SimpleMarkdown content={selectedArticle.content} />
                )}

                {/* Video Suggestions Section */}
                {showVideos && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Youtube className="text-red-600" size={24} />
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        Recommended Videos
                      </h3>
                    </div>

                    {loadingVideos ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        <span className="ml-3 text-gray-600 dark:text-gray-400">Finding best videos with AI...</span>
                      </div>
                    ) : videoSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        {videoSuggestions.map((video, index) => (
                          <a
                            key={index}
                            href={getYouTubeSearchUrl(video.searchQuery)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Play className="text-white" size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-tight mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                  {video.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {video.channel}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {video.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                  {video.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />
                                      {video.duration}
                                    </span>
                                  )}
                                  {video.views && (
                                    <span className="flex items-center gap-1">
                                      <Eye size={12} />
                                      {video.views} views
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ExternalLink className="text-gray-300 dark:text-gray-600 group-hover:text-red-500 transition-colors flex-shrink-0" size={18} />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Youtube size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No videos found for this topic</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-b-3xl">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVideos(!showVideos)}
                    className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${showVideos
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                  >
                    {showVideos ? (
                      <>
                        <FileText size={18} />
                        Read Article
                      </>
                    ) : (
                      <>
                        <Youtube size={18} />
                        Watch Videos
                        {loadingVideos && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-1"></div>}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedArticle(null)
                      setShowVideos(false)
                    }}
                    className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
