'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Search, Store, IndianRupee, Phone, Navigation, MapPinned } from 'lucide-react'
import type { InputShop } from '@/lib/types'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'
import { InputShopService } from '@/lib/inputShops'

export default function InputFinder() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'pmksk' | 'private'>('all')
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [shops, setShops] = useState<InputShop[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState<string>('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  // Load shops on mount
  useEffect(() => {
    loadShops()
  }, [])

  const [generatingShops, setGeneratingShops] = useState(false)

  const loadShops = () => {
    const allShops = InputShopService.getAllShops()
    setShops(allShops)
  }

  const requestLocation = useCallback(async () => {
    setLocationLoading(true)
    setLocationError(null)

    const location = await InputShopService.getUserLocation()

    if (location) {
      setUserLocation(location)

      // Check if we need to regenerate shops for this location
      const shouldRegenerate = InputShopService.shouldRegenerateForLocation(location.lat, location.lng)

      if (shouldRegenerate) {
        setGeneratingShops(true)

        // Generate shops using LLM based on actual location
        const newShops = await InputShopService.generateShopsWithLLM(location.lat, location.lng)

        // Get and display the location name
        const locName = await InputShopService.getLocationName(location.lat, location.lng)
        setLocationName(locName)

        setGeneratingShops(false)

        // Calculate distances for the new shops
        const shopsWithDistance = InputShopService.getShopsNearLocation(
          location.lat,
          location.lng,
          100 // 100km radius
        )
        setShops(shopsWithDistance.length > 0 ? shopsWithDistance : newShops)
      } else {
        // Just load existing shops with distance calculation
        const locName = await InputShopService.getLocationName(location.lat, location.lng)
        setLocationName(locName)

        const shopsWithDistance = InputShopService.getShopsNearLocation(
          location.lat,
          location.lng,
          100 // 100km radius
        )
        setShops(shopsWithDistance)
      }
    } else {
      setLocationError('Location access denied. Showing all shops.')
      // Just load all shops without distance
      loadShops()
    }

    setLocationLoading(false)
  }, [])

  // Request user location on mount
  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  // Filter shops based on search and type
  const filteredShops = InputShopService.searchShops(
    searchQuery,
    selectedType,
    userLocation || undefined
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Store className="text-purple-600" size={36} />
          {getTranslation('inputFinder.title', currentLang)}
        </h2>
        <p className="text-gray-600 text-lg mt-2">
          {getTranslation('inputFinder.description', currentLang)}
        </p>
      </div>

      {/* Location Status Banner */}
      {locationLoading && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-blue-700 dark:text-blue-300 font-medium">Getting your location...</p>
        </div>
      )}

      {generatingShops && !locationLoading && (
        <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <div>
            <p className="text-purple-700 dark:text-purple-300 font-medium">🤖 Finding shops near {locationName || 'your location'}...</p>
            <p className="text-purple-600 dark:text-purple-400 text-sm">Using AI to find relevant agricultural shops</p>
          </div>
        </div>
      )}

      {locationError && (
        <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <MapPinned className="text-orange-600 dark:text-orange-400 mt-0.5" size={20} />
              <div>
                <p className="text-orange-700 dark:text-orange-300 font-medium">{locationError}</p>
                <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">
                  Enable location for distance-based sorting
                </p>
              </div>
            </div>
            <button
              onClick={requestLocation}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {userLocation && !locationLoading && !generatingShops && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPinned className="text-green-600 dark:text-green-400" size={20} />
              <p className="text-green-700 dark:text-green-300 font-medium">
                ✓ Showing shops near {locationName || 'your location'} - sorted by distance
              </p>
            </div>
            <button
              onClick={async () => {
                if (userLocation) {
                  InputShopService.clearCache()
                  await requestLocation()
                }
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      )}

      <div className="glass-effect rounded-3xl p-6 shadow-xl space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation('inputFinder.searchPlaceholder', currentLang)}
            className="w-full pl-16 pr-6 py-5 text-lg border-2 border-gray-300 rounded-2xl focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedType('all')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all ${selectedType === 'all'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-200'
              }`}
          >
            {getTranslation('inputFinder.allShops', currentLang)} ({shops.length})
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedType('pmksk')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all ${selectedType === 'pmksk'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-200'
              }`}
          >
            {getTranslation('inputFinder.pmkskCenters', currentLang)}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedType('private')}
            className={`flex-1 py-4 rounded-2xl font-bold transition-all ${selectedType === 'private'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-white text-gray-700 border-2 border-gray-200'
              }`}
          >
            {getTranslation('inputFinder.privateShops', currentLang)}
          </motion.button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredShops.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-xl text-gray-600">No shops found</p>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredShops.map((shop, index) => (
              <motion.div
                key={shop.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-md border-2 border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{shop.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${shop.type === 'pmksk'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {shop.type === 'pmksk' ? 'PMKSK' : 'Private'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <MapPin size={16} />
                      <span>{shop.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Navigation size={16} />
                      <span>{shop.distance} {getTranslation('inputFinder.kmAway', currentLang)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">{getTranslation('inputFinder.currentPrices', currentLang)}:</p>
                  <div className="space-y-2">
                    {shop.items.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700">{item.name}</span>
                        <span className="font-bold text-gray-900 flex items-center">
                          <IndianRupee size={14} />
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.a
                    href={`tel:${shop.phone}`}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Phone size={20} />
                    {getTranslation('inputFinder.call', currentLang)}
                  </motion.a>
                  <motion.a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(
                      shop.address
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    <Navigation size={20} />
                    {getTranslation('inputFinder.getDirections', currentLang)}
                  </motion.a>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 glass-effect rounded-2xl p-4">
        <p className="text-sm text-gray-600">
          💡 <span className="font-semibold">Tip:</span> PMKSK shops usually offer subsidized
          prices on fertilizers and seeds. Compare prices before buying!
        </p>
      </div>
    </motion.div>
  )
}
