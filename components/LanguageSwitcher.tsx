'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe } from 'lucide-react'
import { languages, Language, getCurrentLanguage, setCurrentLanguage } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>('en')

  useEffect(() => {
    const lang = getCurrentLanguage()
    setCurrentLang(lang)

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang)
    setCurrentLang(lang)
    setIsOpen(false)
    
    // Dispatch event to update all components
    window.dispatchEvent(new Event('languageChange'))
  }

  const currentLanguageData = languages.find(l => l.code === currentLang) || languages[0]

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-effect p-3 rounded-xl flex items-center gap-2 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-100"
        whileTap={{ scale: 0.95 }}
      >
        <Globe size={20} className="text-green-600 dark:text-green-400" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-100">
          {currentLanguageData.flag} {currentLanguageData.nativeName.split('(')[0].trim()}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 glass-effect rounded-2xl shadow-xl z-50 overflow-hidden dark:bg-gray-800/90 dark:border dark:border-gray-700"
            >
              <div className="p-2">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      currentLang === lang.code
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'hover:bg-green-50 dark:hover:bg-gray-700/70'
                    }`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <div>
                        <div className={`font-semibold ${
                          currentLang === lang.code ? 'text-green-600 dark:text-green-300' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {lang.nativeName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lang.name}</div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
