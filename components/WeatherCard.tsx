'use client'

import { motion } from 'framer-motion'
import { Cloud, Sun, CloudRain, Wind, Droplets, ThermometerSun, MapPin, AlertCircle, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { WeatherService, type WeatherData } from '@/lib/weather'
import { storage } from '@/lib/storage'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'

interface WeatherCardProps {
  fullView?: boolean
  darkMode?: boolean
}

export default function WeatherCard({ fullView = false, darkMode = false }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('en')

  useEffect(() => {
    loadWeather()
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const loadWeather = async () => {
    const user = storage.getUser()
    const location = user?.location || 'New Delhi, IN'
    setLoading(true)

    const getGeolocation = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          reject(new Error('Geolocation not supported'))
          return
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5 * 60 * 1000,
        })
      })

    try {
      let data: WeatherData

      try {
        const position = await getGeolocation()
        data = await WeatherService.fetchWeatherByCoordinates(
          position.coords.latitude,
          position.coords.longitude,
          location
        )
      } catch (geoError) {
        console.warn('Geolocation unavailable, falling back to profile location', geoError)
        data = await WeatherService.fetchWeather(location)
      }

      setWeather(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load weather:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return Sun
      case 'rainy':
        return CloudRain
      case 'cloudy':
        return Cloud
      case 'partly cloudy':
        return Cloud
      default:
        return Sun
    }
  }

  if (!weather) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className={`glass-effect rounded-3xl p-12 text-center ${darkMode ? 'bg-gray-800/90' : ''}`}>
          <Cloud className="w-16 h-16 mx-auto mb-4 animate-pulse text-gray-400 dark:text-gray-500" />
          <p className="text-secondary">{getTranslation('common.loading', currentLang)}</p>
        </div>
      </motion.section>
    )
  }

  const advice = WeatherService.getWeatherAdvice(weather)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Cloud className="text-blue-600" size={32} />
          {getTranslation('crops.weatherToday', currentLang)}
        </h3>
        <button
          onClick={loadWeather}
          disabled={loading}
          className={`font-semibold text-lg flex items-center gap-2 disabled:opacity-50 text-blue-600 dark:text-blue-400`}
        >
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          {getTranslation('common.refresh', currentLang)}
        </button>
      </div>

      {/* Current Weather */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`glass-effect rounded-3xl p-6 mb-4 shadow-xl ${darkMode ? 'bg-gray-800/90' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-secondary">
            <MapPin size={18} />
            <span className="text-lg font-semibold">{weather.location.city}</span>
          </div>
          <span className="text-sm text-tertiary">
            {lastUpdated?.toLocaleTimeString() || ''}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-6xl font-bold text-primary">{weather.current.temp}°C</p>
            <p className="text-xl mt-2 text-secondary">{getTranslation(`weather.${weather.current.condition.toLowerCase().replace(' ', '')}`, currentLang) || weather.current.condition}</p>
            <p className="text-sm mt-1 text-tertiary">
              {getTranslation('common.feelsLike', currentLang)} {weather.current.feelsLike}°C
            </p>
          </div>
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            {(() => {
              const IconComponent = getWeatherIcon(weather.current.condition)
              return <IconComponent size={48} className="text-white" />
            })()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <Droplets className="mx-auto mb-2 text-blue-600" size={28} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getTranslation('dashboard.humidity', currentLang)}
            </p>
            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{weather.current.humidity}%</p>
          </div>
          <div className="text-center">
            <Wind className={`mx-auto mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} size={28} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {getTranslation('dashboard.wind', currentLang)}
            </p>
            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{weather.current.wind} km/h</p>
          </div>
          <div className="text-center">
            <CloudRain className="mx-auto mb-2 text-blue-500" size={28} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{getTranslation('dashboard.rain', currentLang)}</p>
            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{weather.current.rainfall} mm</p>
          </div>
          <div className="text-center">
            <Sun className="mx-auto mb-2 text-yellow-500" size={28} />
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{getTranslation('dashboard.uv', currentLang)}</p>
            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{weather.current.uvIndex}</p>
          </div>
        </div>
      </motion.div>

      {/* Weather Advisory */}
      {advice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`glass-effect rounded-2xl p-5 mb-4 shadow-md ${darkMode ? 'bg-gray-800/90' : ''}`}
        >
          <h4 className="font-bold mb-3 flex items-center gap-2 text-primary">
            <AlertCircle className="text-orange-500" size={24} />
            {getTranslation('weather.farmAdvisory', currentLang)}
          </h4>
          <div className="space-y-2">
            {advice.map((key, index) => (
              <p key={index} className="text-sm text-primary">
                {getTranslation(key, currentLang)}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Forecast */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {weather.forecast.map((day, index) => {
          const IconComponent = getWeatherIcon(day.condition)
          const dayTranslationKey = day.day === 'Today' ? 'dashboard.today' : day.day === 'Tomorrow' ? 'dashboard.tomorrow' : `days.${day.day.toLowerCase()}`
          return (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`glass-effect rounded-2xl p-4 text-center shadow-md ${darkMode ? 'bg-gray-800/90' : ''}`}
            >
              <p className="text-sm font-semibold mb-2 text-secondary">
                {getTranslation(dayTranslationKey, currentLang) === dayTranslationKey ? day.day : getTranslation(dayTranslationKey, currentLang)}
              </p>
              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                <IconComponent size={24} className="text-white" />
              </div>
              <p className="text-xl font-bold text-primary">{day.temp}°</p>
              <p className="text-xs mt-1 text-tertiary">
                {day.tempMin}° / {day.tempMax}°
              </p>
              {day.precipitation > 0 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-blue-600">
                  <Droplets size={14} />
                  <span className="text-xs">{day.precipitation}%</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
