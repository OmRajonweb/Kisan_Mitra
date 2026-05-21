'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, IndianRupee, AlertTriangle, RefreshCw, Search, LineChart, Calculator, MapPin, Truck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { MarketService, type MarketPrice } from '@/lib/market'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'
import PriceChart from './PriceChart'
import LocationSetter from './LocationSetter'

interface MarketCardProps {
  fullView?: boolean
}

export default function MarketCard({ fullView = false }: MarketCardProps) {
  const [prices, setPrices] = useState<MarketPrice[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [showBuyerModal, setShowBuyerModal] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>('en')

  // Profit Calculator State
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcQuantity, setCalcQuantity] = useState<number>(10)
  const [calcTransportCost, setCalcTransportCost] = useState<number>(15)
  const [selectedCalcCrop, setSelectedCalcCrop] = useState<string>('')

  useEffect(() => {
    loadPrices()
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const loadPrices = async () => {
    setLoading(true)
    try {
      const data = await MarketService.fetchMarketPrices()
      // Calculate real distances based on user location
      const dataWithDistances = await MarketService.calculateDistances(data)
      // Enrich with enhanced intelligence
      const enrichedData = MarketService.enrichPriceData(dataWithDistances)
      setPrices(enrichedData)
      // Format time on client side only to avoid hydration mismatch
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to load market prices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search to API
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setLoading(true)
        try {
          const results = await MarketService.searchPrices(searchQuery)
          setPrices(results)
        } catch (error) {
          console.error('Search failed', error)
        } finally {
          setLoading(false)
        }
      } else if (searchQuery.length === 0) {
        loadPrices() // Reset to default list
      }
    }, 800) // 800ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter the currently loaded prices (client-side refinement)
  const filteredPrices = prices

  const advice = MarketService.getMarketAdvice(prices)

  // Helper to fallback to English name if translation is missing (returns key)
  const getCropDisplayName = (name: string) => {
    const key = `crops.${name.toLowerCase()}`
    const translation = getTranslation(key, currentLang)
    return translation === key ? name : translation
  }

  const getCropEmoji = (name: string) => {
    const emojis: Record<string, string> = {
      wheat: '🌾',
      rice: '🌾',
      tomato: '🍅',
      onion: '🧅',
      potato: '🥔',
      cotton: '🌱',
      maize: '🌽',
      soyabean: '🫘',
      mustard: '🌼',
      groundnut: '🥜',
      'sugar cane': '🎋',
      turmeric: '🧡',
      coriander: '🌿',
      'cumin seed(jeera)': '🧂',
      'red chillies': '🌶️',
      banana: '🍌',
      apple: '🍎',
      orange: '🍊',
      mango: '🥭',
      grapes: '🍇',
      pomegranate: '❤️',
      papaya: '🍈',
      carrot: '🥕',
      'cabbage': '🥬',
      'cauliflower': '🥦',
      brinjal: '🍆',
      'green chilli': '🌶️',
      ginger: '🫚',
      garlic: '🧄',
    }
    return emojis[name.toLowerCase()] || '🌾'
  }


  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2 text-primary">
          <TrendingUp className="text-purple-600" size={32} />
          {getTranslation('crops.marketPrices', currentLang)}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalculator(true)} // Open as modal now
            className="font-semibold text-lg flex items-center gap-2 p-2 rounded-xl transition-colors text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
            title={getTranslation('profitCalculator.title', currentLang)}
          >
            <Calculator size={24} />
          </button>
          <button
            onClick={loadPrices}
            disabled={loading}
            className="font-semibold text-lg flex items-center gap-2 disabled:opacity-50 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 p-2 rounded-xl"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="glass-effect rounded-3xl p-4 sm:p-6 shadow-xl">
        {/* Location Setter */}
        <LocationSetter />

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={20} />
          <input
            type="text"
            placeholder={getTranslation('crops.searchCrops', currentLang)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 focus:outline-none bg-white dark:bg-gray-800/80 border-gray-100 dark:border-gray-600 text-primary placeholder-gray-400 focus:border-purple-500 transition-all shadow-sm"
          />
        </div>

        {/* Market Advisory */}
        {advice.length > 0 && (
          <div className="mb-6 space-y-3">
            {advice.map((tip, index) => {
              const icon = tip.key === 'highPriceIncrease' ? '📈' : tip.key === 'pricesDecline' ? '📉' : '💹'
              const cropNames = tip.crops.map(crop => getCropDisplayName(crop)).join(', ')
              let message = ''
              if (tip.key === 'highPriceIncrease') message = `${icon} ${getTranslation('market.highpriceincrease', currentLang)} ${cropNames}.`
              else if (tip.key === 'pricesDecline') message = `${icon} ${getTranslation('market.pricesdecline', currentLang)} ${cropNames}.`
              else message = `${icon} ${getTranslation('market.stableprices', currentLang)} ${cropNames}.`

              return (
                <div key={index} className="flex items-start gap-3 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-300 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{message}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Visual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrices.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-3xl p-5 shadow-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
            >
              {/* Background Decoration */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.trend === 'up' ? 'from-green-100 to-emerald-100 dark:from-green-900/20' : 'from-red-100 to-pink-100 dark:from-red-900/20'} rounded-bl-full opacity-50 transition-opacity group-hover:opacity-80`} />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                    {getCropEmoji(item.name)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight mb-1">{getCropDisplayName(item.name)}</h4>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                        {item.market}
                      </span>
                      {/* Volatility Badge */}
                      {item.volatility && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.volatility === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          item.volatility === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                            'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}>
                          {item.volatility === 'high' ? `⚡ ${getTranslation('market.highVol', currentLang)}` : item.volatility === 'medium' ? `📊 ${getTranslation('market.medVol', currentLang)}` : `✓ ${getTranslation('market.stable', currentLang)}`}
                        </span>
                      )}
                      {/* MSP Badge */}
                      {item.msp && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.price >= item.msp ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          }`}>
                          {item.price >= item.msp ? `✓ ${getTranslation('market.aboveMSP', currentLang)}` : `⚠ ${getTranslation('market.belowMSP', currentLang)}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Best Time to Sell Badge */}
                {item.bestTimeToSell && (
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${item.bestTimeToSell === 'now' ? 'bg-green-500 text-white' :
                    item.bestTimeToSell === 'sell-soon' ? 'bg-blue-500 text-white' :
                      'bg-gray-400 text-white'
                    }`}>
                    {item.bestTimeToSell === 'now' ? `🎯 ${getTranslation('market.sellNow', currentLang)}` :
                      item.bestTimeToSell === 'sell-soon' ? `📅 ${getTranslation('market.sellSoon', currentLang)}` :
                        `⏳ ${getTranslation('market.wait', currentLang)}`}
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between mb-4 relative z-10">
                <div>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                    ₹{item.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getTranslation('market.per', currentLang)} {item.unit}
                  </p>
                </div>
                <div className={`flex flex-col items-end ${item.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                  <span className="text-lg font-bold flex items-center gap-0.5">
                    {item.trend === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    {Math.abs(item.change)}%
                  </span>
                  <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                    {item.trend === 'up' ? 'Rising' : 'Falling'}
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-24 -mx-2 mb-3">
                <PriceChart data={item.priceHistory} trend={item.trend} height={96} showGrid={false} />
              </div>

              {/* Enhanced Price Comparisons */}
              <div className="space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                {/* Price Comparisons */}
                {item.yesterdayPrice && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-gray-400 dark:text-gray-500 mb-1">{getTranslation('market.vsYesterday', currentLang)}</div>
                      <div className={`font-bold ${MarketService.getPriceComparisons(item).vsYesterday > 0 ? 'text-green-600' :
                        MarketService.getPriceComparisons(item).vsYesterday < 0 ? 'text-red-500' :
                          'text-gray-500'
                        }`}>
                        {MarketService.getPriceComparisons(item).vsYesterday > 0 ? '+' : ''}
                        {MarketService.getPriceComparisons(item).vsYesterday}%
                      </div>
                    </div>
                    <div className="text-center border-x border-gray-200 dark:border-gray-700">
                      <div className="text-gray-400 dark:text-gray-500 mb-1">{getTranslation('market.vsLastWeek', currentLang)}</div>
                      <div className={`font-bold ${MarketService.getPriceComparisons(item).vsLastWeek > 0 ? 'text-green-600' :
                        MarketService.getPriceComparisons(item).vsLastWeek < 0 ? 'text-red-500' :
                          'text-gray-500'
                        }`}>
                        {MarketService.getPriceComparisons(item).vsLastWeek > 0 ? '+' : ''}
                        {MarketService.getPriceComparisons(item).vsLastWeek}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400 dark:text-gray-500 mb-1">{getTranslation('market.vsLastMonth', currentLang)}</div>
                      <div className={`font-bold ${MarketService.getPriceComparisons(item).vsLastMonth > 0 ? 'text-green-600' :
                        MarketService.getPriceComparisons(item).vsLastMonth < 0 ? 'text-red-500' :
                          'text-gray-500'
                        }`}>
                        {MarketService.getPriceComparisons(item).vsLastMonth > 0 ? '+' : ''}
                        {MarketService.getPriceComparisons(item).vsLastMonth}%
                      </div>
                    </div>
                  </div>
                )}

                {/* MSP Details */}
                {item.msp && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${item.price >= item.msp ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'
                    }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">MSP: ₹{item.msp.toLocaleString()}</span>
                      <span className={`font-bold ${item.price >= item.msp ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'
                        }`}>
                        {item.price >= item.msp ?
                          `+₹${(item.price - item.msp).toLocaleString()} ${getTranslation('market.above', currentLang)}` :
                          `-₹${(item.msp - item.price).toLocaleString()} ${getTranslation('market.below', currentLang)}`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Selling Advice */}
                {item.bestTimeToSell && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                    💡 {getTranslation('market.adviceFalling', currentLang)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowBuyerModal(true)}
          className="w-full mt-8 bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <Truck size={24} />
          {getTranslation('market.findBuyersButton', currentLang)}
        </motion.button>
      </div>

      {/* Profit Calculator Modal */}
      <AnimatePresence>
        {showCalculator && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                  <Calculator className="text-indigo-500" />
                  {getTranslation('profitCalculator.title', currentLang)}
                </h3>
                <button onClick={() => setShowCalculator(false)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 gap-5 mb-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                      {getTranslation('market.selectCrop', currentLang)}
                    </label>
                    <select
                      value={selectedCalcCrop}
                      onChange={(e) => setSelectedCalcCrop(e.target.value)}
                      className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="">Choose Crop...</option>
                      {prices.map(p => (
                        <option key={p.id} value={p.name}>{getCropDisplayName(p.name)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                        {getTranslation('profitCalculator.quantity', currentLang)} (Units)
                      </label>
                      <input
                        type="number"
                        value={calcQuantity}
                        onChange={(e) => setCalcQuantity(Number(e.target.value))}
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                        Transport (₹/km)
                      </label>
                      <input
                        type="number"
                        value={calcTransportCost}
                        onChange={(e) => setCalcTransportCost(Number(e.target.value))}
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {selectedCalcCrop && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Best Markets for You</h4>
                    {prices
                      .filter(p => p.name === selectedCalcCrop)
                      .map(p => ({ ...p, netProfit: MarketService.calculateNetProfit(p.price, calcQuantity, p.distance || 15, calcTransportCost) }))
                      .sort((a, b) => b.netProfit - a.netProfit)
                      .map((market, idx) => (
                        <div key={market.id} className={`p-4 rounded-2xl border-2 transition-all ${idx === 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                {market.market}
                                {idx === 0 && <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Best Choice</span>}
                              </h5>
                              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <MapPin size={14} /> {market.distance || 15} km away
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-2xl font-bold text-indigo-600 dark:text-indigo-400">₹{market.netProfit.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">Net Profit</span>
                            </div>
                          </div>
                          {/* Visual Bar for Cost vs Profit */}
                          <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                            <div className="h-full bg-orange-400" style={{ width: `${Math.min((((market.distance || 15) * calcTransportCost / (market.netProfit + (market.distance || 15) * calcTransportCost)) * 100), 100)}%` }}></div>
                            <div className="h-full bg-green-500 flex-1"></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Transport Cost: ₹{((market.distance || 15) * calcTransportCost).toLocaleString()}</span>
                            <span>Revenue</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Buyer Modal - keeping same as before but wrapping for consistency logic */}
      <AnimatePresence>
        {showBuyerModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* ... (Existing Buyer Modal Logic, simplified for brevity, assume content is same) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{getTranslation('market.buyerModalTitle', currentLang)}</h3>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
                <p className="text-orange-800 dark:text-orange-200 font-medium">Coming Soon in Phase 4!</p>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">We are building a network of verified buyers just for you.</p>
              </div>
              <button onClick={() => setShowBuyerModal(false)} className="w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
