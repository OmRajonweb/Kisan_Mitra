'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Cloud,
  Sprout,
  TrendingUp,
  BookOpen,
  Menu,
  X,
  Sun,
  Droplets,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  RefreshCw,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import WeatherCard from '@/components/WeatherCard'
import CropCard from '@/components/CropCard'
import MarketCard from '@/components/MarketCard'
import KnowledgeCard from '@/components/KnowledgeCard'
import AIAssistant from '@/components/AIAssistant'
import CropDiagnosis from '@/components/CropDiagnosis'
import InputFinder from '@/components/InputFinder'
import CropRecommendation from '@/components/CropRecommendation'
import VoiceAssistant from '@/components/VoiceAssistant'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import TelegramConnect from '@/components/TelegramConnect'
import { storage } from '@/lib/storage'
import { getTranslation, getCurrentLanguage, Language } from '@/lib/i18n'
import { GroqService } from '@/lib/groq'

export default function Dashboard() {
  const [user, setUser] = useState({ name: 'Farmer', location: 'Your Farm', farmSize: '0' })
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [showAIChat, setShowAIChat] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTelegramConnect, setShowTelegramConnect] = useState(false)
  const [aiInitialMessage, setAiInitialMessage] = useState<string>('')
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [darkMode, setDarkMode] = useState(false)
  const [aiInsight, setAiInsight] = useState<string>('')
  const [aiInsightLoading, setAiInsightLoading] = useState(false)
  const [aiInsightError, setAiInsightError] = useState(false)
  const groq = useMemo(() =>new GroqService(), [])

  useEffect(() => {
    const userData = storage.getUser()
    if (userData) {
      setUser(userData)
    }
    setCurrentLang(getCurrentLanguage())

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.documentElement.classList.add('dark')
    }

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    const handleOpenAIAssistant = (event: any) => {
      const message = event.detail?.message || ''
      setAiInitialMessage(message)
      setShowAIChat(true)
    }

    const handleOpenCropDiagnosis = () => {
      setActiveTab('diagnosis')
    }

    window.addEventListener('languageChange', handleLanguageChange)
    window.addEventListener('openAIAssistant', handleOpenAIAssistant)
    window.addEventListener('openCropDiagnosis', handleOpenCropDiagnosis)

    return () => {
      window.removeEventListener('languageChange', handleLanguageChange)
      window.removeEventListener('openAIAssistant', handleOpenAIAssistant)
      window.removeEventListener('openCropDiagnosis', handleOpenCropDiagnosis)
    }
  }, [])

  useEffect(() => {
    // Load saved insight on mount
    const savedInsight = storage.getAiInsight()
    if (savedInsight) {
      setAiInsight(savedInsight)
    }
  }, [])

  const fetchAiInsight = async () => {
    setAiInsightLoading(true)
    setAiInsightError(false)
    try {
      const crops = storage.getCrops()
      const userData = storage.getUser()
      const cropList = crops.length > 0
        ? crops.map((c) => `${c.name}${(c as any).stage ? ` (${(c as any).stage})` : ''}`).join(', ')
        : getTranslation('crops.noCrops', currentLang)
      const prompt = `Provide a concise farming tip (within 3 sentences) for an Indian farmer.
Farmer details:
- Location: ${userData?.location || 'Unknown'}
- Farm size: ${userData?.farmSize || 'Unknown'} acres
- Crops: ${cropList}

Tip must be practical, season-aware if possible, and include an actionable next step. Respond in ${currentLang}.`

      const response = await groq.chat([
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ], currentLang)

      setAiInsight(response)
      storage.setAiInsight(response)
    } catch (error) {
      console.error('AI insight error', error)
      setAiInsightError(true)
    } finally {
      setAiInsightLoading(false)
    }
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = () => {
    storage.setOnboarded(false)
    localStorage.removeItem('kisanMitraUser')
    window.location.href = '/'
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': {
        const crops = storage.getCrops()
        const primaryCrop = crops[0]?.name || ''
        const numericFarmSize = parseFloat(String(user.farmSize)) || 1
        const weatherSnapshot = {
          humidity: 58,
          rainChance: 28,
          windSpeed: 11,
        }
        const drynessScore = Math.min(
          100,
          Math.max(0, 100 - weatherSnapshot.humidity + weatherSnapshot.windSpeed * 1.5 - weatherSnapshot.rainChance * 0.5)
        )
        const irrigationKey =
          drynessScore > 65
            ? 'dashboard.irrigationPlannerDry'
            : drynessScore > 35
              ? 'dashboard.irrigationPlannerOptimal'
              : 'dashboard.irrigationPlannerWet'
        const irrigationAmount = `${Math.max(10, Math.round(numericFarmSize * (drynessScore > 65 ? 18 : drynessScore > 35 ? 12 : 6)))} mm`
        const irrigationMessage = getTranslation(irrigationKey, currentLang).replace('{amount}', irrigationAmount)
        const irrigationFill = Math.max(20, Math.min(100, Math.round(drynessScore)))

        const tasks: string[] = [getTranslation('dashboard.smartActions.soilTask', currentLang)]
        if (drynessScore > 55) {
          tasks.push(getTranslation('dashboard.smartActions.irrigationTask', currentLang))
        }
        tasks.push(
          primaryCrop
            ? getTranslation('dashboard.smartActions.pestTask', currentLang).replace('{crop}', primaryCrop)
            : getTranslation('dashboard.smartActions.marketTask', currentLang)
        )

        const dayValue = new Date().getDate()
        const trendSeed = (dayValue + (primaryCrop ? primaryCrop.length : 3)) % 3
        const marketMessage = primaryCrop
          ? getTranslation(
            trendSeed === 0
              ? 'dashboard.marketPulseRising'
              : trendSeed === 1
                ? 'dashboard.marketPulseFalling'
                : 'dashboard.marketPulseStable',
            currentLang
          ).replace('{crop}', primaryCrop)
          : getTranslation('dashboard.marketPulseNoCrop', currentLang)
        const marketTrendLabel = trendSeed === 0 ? '↑' : trendSeed === 1 ? '↓' : '→'

        return (
          <>
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl shadow-xl text-white"
            >
              <h2 className="text-2xl font-bold mb-1">
                {getTranslation('dashboard.greeting', currentLang).replace('{name}', user.name)} 🌱
              </h2>
              <p className="text-green-100 text-sm sm:text-base">
                {getTranslation('dashboard.greeting', currentLang)}
              </p>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`glass-effect rounded-2xl p-4 shadow-md ${darkMode ? 'bg-gray-800/90' : ''}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <Cloud size={22} className={darkMode ? 'text-blue-300' : 'text-blue-600'} />
                  </div>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getTranslation('dashboard.weather', currentLang)}
                  </span>
                </div>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>28°C</p>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {getTranslation('weather.partlycloudy', currentLang)} · {weatherSnapshot.rainChance}%
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`glass-effect rounded-2xl p-4 shadow-md ${darkMode ? 'bg-gray-800/90' : ''}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                    <Sprout size={22} className={darkMode ? 'text-green-300' : 'text-green-600'} />
                  </div>
                  <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getTranslation('dashboard.myCrops', currentLang)}
                  </span>
                </div>
                <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{crops.length}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{getTranslation('dashboard.growingWell', currentLang)}</p>
              </motion.div>
            </div>

            {/* AI Insight + Weather */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            >
              <div className={`glass-effect rounded-2xl p-5 shadow-md flex flex-col gap-4 ${darkMode ? 'bg-gray-800/90' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-900/40' : 'bg-purple-100'}`}>
                    <MessageCircle size={22} className={darkMode ? 'text-purple-300' : 'text-purple-600'} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {getTranslation('dashboard.aiInsights.title', currentLang)}
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getTranslation('dashboard.aiInsights.description', currentLang)}
                    </p>
                  </div>
                </div>

                <div className={`rounded-2xl border border-dashed ${darkMode ? 'border-purple-500/40 bg-gray-900/40' : 'border-purple-200 bg-purple-50/60'} p-4 min-h-[120px]`}>
                  {aiInsightLoading ? (
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {getTranslation('dashboard.aiInsights.loading', currentLang)}
                    </p>
                  ) : aiInsightError ? (
                    <p className="text-red-500 text-sm">
                      {getTranslation('dashboard.aiInsights.error', currentLang)}
                    </p>
                  ) : (
                    <p className={`${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{aiInsight}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      const message = aiInsight || getTranslation('ai.askAnything', currentLang)
                      setAiInitialMessage(message)
                      setShowAIChat(true)
                    }}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    {getTranslation('dashboard.aiInsights.action', currentLang)}
                  </button>
                  <button
                    onClick={fetchAiInsight}
                    className="btn-secondary py-3 px-4 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} className={aiInsightLoading ? 'animate-spin' : ''} />
                    {getTranslation('dashboard.aiInsights.refresh', currentLang)}
                  </button>
                </div>
              </div>

              <div className="hidden md:block">
                <WeatherCard />
              </div>
            </motion.div>

            {/* AI Features Quick Access */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                🤖 {getTranslation('knowledgeCard.aiPoweredFeatures', currentLang)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAIChat(true)}
                  className={`glass-effect rounded-2xl p-4 shadow-md text-left ${darkMode ? 'bg-gray-800/90' : ''}`}
                >
                  <MessageCircle className={darkMode ? 'text-blue-400 mb-2' : 'text-blue-600 mb-2'} size={26} />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {getTranslation('knowledgeCard.aiAssistant', currentLang)}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getTranslation('knowledgeCard.chatInYourLanguage', currentLang)}
                  </p>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('diagnosis')}
                  className={`glass-effect rounded-2xl p-4 shadow-md text-left ${darkMode ? 'bg-gray-800/90' : ''}`}
                >
                  <Sprout className={darkMode ? 'text-green-400 mb-2' : 'text-green-600 mb-2'} size={26} />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getTranslation('dashboard.cropDiagnosis.title', currentLang)}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getTranslation('dashboard.cropDiagnosis.scanCropDiseases', currentLang)}</p>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('recommendation')}
                  className={`glass-effect rounded-2xl p-4 shadow-md text-left ${darkMode ? 'bg-gray-800/90' : ''}`}
                >
                  <Sun className={darkMode ? 'text-yellow-400 mb-2' : 'text-yellow-600 mb-2'} size={26} />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {getTranslation('dashboard.cropAdvisor', currentLang)}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getTranslation('dashboard.whatToGrowNext', currentLang)}
                  </p>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('inputs')}
                  className={`glass-effect rounded-2xl p-4 shadow-md text-left ${darkMode ? 'bg-gray-800/90' : ''}`}
                >
                  <TrendingUp className={darkMode ? 'text-purple-400 mb-2' : 'text-purple-600 mb-2'} size={26} />
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{getTranslation('inputFinder.title', currentLang)}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getTranslation('inputFinder.findNearbyShops', currentLang)}</p>
                </motion.button>
              </div>
            </motion.div>

            {/* Smart Actions & Novelty Features */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                ✨ {getTranslation('dashboard.smartActions.title', currentLang)}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className={`glass-effect rounded-2xl p-4 shadow-md flex flex-col gap-3 ${darkMode ? 'bg-gray-800/90' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {getTranslation('dashboard.smartActions.title', currentLang)}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.location === 'Your Farm' || user.location === 'Unknown' ? getTranslation('dashboard.yourFarm', currentLang) : user.location}</p>
                    </div>
                    <Sparkles size={22} className="text-emerald-400" />
                  </div>
                  <ul className="space-y-2 text-sm">
                    {tasks.map((task, index) => (
                      <li key={index} className={`flex items-start gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        <CheckCircle size={16} className="mt-0.5 text-emerald-400" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn-secondary mt-auto flex items-center justify-center gap-2"
                    onClick={() => {
                      setAiInitialMessage(tasks.join('\n'))
                      setShowAIChat(true)
                    }}
                  >
                    <MessageCircle size={16} />
                    {getTranslation('dashboard.aiInsights.action', currentLang)}
                  </button>
                </div>

                <div className={`glass-effect rounded-2xl p-4 shadow-md flex flex-col gap-3 ${darkMode ? 'bg-gray-800/90' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Droplets size={20} className="text-blue-400" />
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {getTranslation('dashboard.smartActions.irrigationTask', currentLang)}
                    </p>
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{irrigationMessage}</div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${irrigationFill}%` }}
                    />
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {Math.round(drynessScore)}% field dryness · {weatherSnapshot.humidity}% humidity
                  </div>
                </div>

                <div className={`glass-effect rounded-2xl p-4 shadow-md flex flex-col gap-3 ${darkMode ? 'bg-gray-800/90' : ''}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-400" />
                    <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {getTranslation('dashboard.smartActions.marketTask', currentLang)} {marketTrendLabel}
                    </p>
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{marketMessage}</div>
                  <button
                    className="btn-secondary flex items-center justify-center gap-2"
                    onClick={() => {
                      setAiInitialMessage(primaryCrop ? `${marketMessage}\n${getTranslation('dashboard.aiInsights.action', currentLang)}` : marketMessage)
                      setShowAIChat(true)
                    }}
                  >
                    <MessageCircle size={16} />
                    {getTranslation('knowledgeCard.chatWithAI', currentLang)}
                  </button>
                </div>
              </div>
            </motion.div>

            <CropCard darkMode={darkMode} />
          </>
        )
      }
      case 'weather':
        return <WeatherCard fullView />
      case 'market':
        return <MarketCard fullView />
      case 'learn':
        return <KnowledgeCard fullView onOpenAI={() => setShowAIChat(true)} />
      case 'diagnosis':
        return <CropDiagnosis darkMode={darkMode} />
      case 'recommendation':
        return <CropRecommendation />
      case 'inputs':
        return <InputFinder />
      default:
        return null
    }
  }

  return (
    <div className={`min-h-screen pb-24 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`glass-effect sticky top-0 z-50 shadow-md ${darkMode ? 'bg-gray-800/90' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Sprout size={28} className="text-white" />
              </motion.div>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {getTranslation('common.appName', currentLang)}
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{user.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-xl shadow-md transition-colors ${darkMode ? 'bg-gray-700/80 text-yellow-300 hover:bg-gray-600/80' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <LanguageSwitcher />
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={`relative p-3 rounded-xl shadow-md transition-colors ${darkMode ? 'bg-gray-700/80 text-gray-200 hover:bg-gray-600/80' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                <Bell size={24} className={darkMode ? 'text-gray-200' : 'text-gray-700'} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-3 rounded-xl shadow-md transition-colors ${darkMode ? 'bg-gray-700/80 text-gray-100 hover:bg-gray-600/80' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                {menuOpen ? <X size={24} className={darkMode ? 'text-gray-100' : 'text-gray-700'} /> : <Menu size={24} className={darkMode ? 'text-gray-100' : 'text-gray-700'} />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute top-full right-4 mt-2 w-64 rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800/95 border border-gray-700' : 'bg-white'}`}
          >
            <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <p className="font-bold text-lg">{user.name}</p>
              <p className="text-sm opacity-90">{user.farmSize} acres</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setShowSettings(true)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${darkMode ? 'text-gray-200 hover:bg-gray-700/70' : 'hover:bg-gray-100'}`}
              >
                <Settings size={20} />
                <span>{getTranslation('dashboard.settingsMenu', currentLang)}</span>
              </button>
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'hover:bg-red-50 text-red-600'}`}
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Voice Assistant Floating Button */}
      <VoiceAssistant />

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIAssistant
          onClose={() => {
            setShowAIChat(false)
            setAiInitialMessage('')
          }}
          initialMessage={aiInitialMessage}
          darkMode={darkMode}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative z-10 w-[90%] max-w-md glass-effect rounded-3xl shadow-2xl p-6 ${darkMode ? 'bg-gray-800/95' : 'bg-white'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {getTranslation('dashboard.settingsTitle', currentLang)}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getTranslation('dashboard.settingsDescription', currentLang)}
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                aria-label={getTranslation('dashboard.settingsClose', currentLang)}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700/80' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`flex items-center justify-between rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-900/60' : 'bg-gray-50'}`}>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {getTranslation('dashboard.settingsDarkMode', currentLang)}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {darkMode ? getTranslation('dashboard.settingsDarkModeOn', currentLang) : getTranslation('dashboard.settingsDarkModeOff', currentLang)}
                  </p>
                </div>
                <button
                  onClick={() => toggleDarkMode()}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${darkMode ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                >
                  {darkMode ? getTranslation('dashboard.settingsTurnOff', currentLang) : getTranslation('dashboard.settingsTurnOn', currentLang)}
                </button>
              </div>

              <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-900/60' : 'bg-gray-50'}`}>
                <p className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {getTranslation('dashboard.settingsLanguage', currentLang)}
                </p>
                <LanguageSwitcher />
              </div>

              <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-900/60' : 'bg-gray-50'}`}>
                <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Telegram Bot
                </p>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Get weather alerts, market updates & reminders
                </p>
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowSettings(false)
                    setShowTelegramConnect(true)
                  }}
                >
                  <MessageCircle size={18} />
                  Connect Telegram
                </button>
              </div>

              <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-gray-900/60' : 'bg-gray-50'}`}>
                <p className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {getTranslation('dashboard.settingsAiShortcut', currentLang)}
                </p>
                <button
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowSettings(false)
                    setAiInitialMessage(getTranslation('ai.howCanHelp', currentLang))
                    setShowAIChat(true)
                  }}
                >
                  <MessageCircle size={18} />
                  {getTranslation('knowledgeCard.chatWithAI', currentLang)}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Telegram Connect Modal */}
      {showTelegramConnect && (
        <TelegramConnect onClose={() => setShowTelegramConnect(false)} />
      )}

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 glass-effect border-t border-gray-200 shadow-lg dark:bg-gray-800/90 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-2 py-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeTab === 'home'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300'
                }`}
            >
              <Sprout size={28} />
              <span className="text-[10px] md:text-xs font-semibold text-center leading-tight">{getTranslation('dashboard.myCrops', currentLang)}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('weather')}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeTab === 'weather'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300'
                }`}
            >
              <Cloud size={28} />
              <span className="text-[10px] md:text-xs font-semibold text-center leading-tight">{getTranslation('dashboard.weather', currentLang)}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('market')}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeTab === 'market'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300'
                }`}
            >
              <TrendingUp size={28} />
              <span className="text-[10px] md:text-xs font-semibold text-center leading-tight">{getTranslation('dashboard.market', currentLang)}</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab('learn')}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeTab === 'learn'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-300'
                }`}
            >
              <BookOpen size={28} />
              <span className="text-[10px] md:text-xs font-semibold text-center leading-tight">{getTranslation('nav.learn', currentLang)}</span>
            </motion.button>
          </div>
        </div>
      </motion.nav>
    </div>
  )
}
