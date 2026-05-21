'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Volume2, Languages } from 'lucide-react'
import { storage } from '@/lib/storage'
import { SpeechService } from '@/lib/speech'
import { TranslationService } from '@/lib/translation'
import { getCurrentLanguage, getTranslation, type Language } from '@/lib/i18n'

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN')
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [transcript, setTranscript] = useState('')

  useEffect(() => {
    // Load user's preferred voice language
    const savedLang = storage.getLanguage()
    if (savedLang) {
      setSelectedLanguage(savedLang)
    }
    
    // Get app language and sync with voice language
    const appLang = getCurrentLanguage()
    setCurrentLang(appLang)
    
    // Convert app language to voice language format if no voice language is saved
    if (!savedLang) {
      const voiceLang = `${appLang}-IN`
      setSelectedLanguage(voiceLang)
      storage.setLanguage(voiceLang)
    }
    
    const handleLanguageChange = () => {
      const newAppLang = getCurrentLanguage()
      setCurrentLang(newAppLang)
      
      // Sync voice language with app language
      const newVoiceLang = `${newAppLang}-IN`
      setSelectedLanguage(newVoiceLang)
      storage.setLanguage(newVoiceLang)
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const handleVoiceCommand = async () => {
    if (!SpeechService.isSpeechSupported()) {
      alert(getTranslation('ai.voiceNotSupported', currentLang))
      return
    }

    try {
      setIsListening(true)
      setShowTooltip(false)

      // Listen using Web Speech API (works offline)
      const spokenText = await SpeechService.listenWebSpeech(selectedLanguage)
      setTranscript(spokenText)
      
      // Process voice command
      await processVoiceCommand(spokenText)
      
      setIsListening(false)
    } catch (error) {
      console.error('Voice recognition failed:', error)
      setIsListening(false)
      await speak(getTranslation('ai.voiceError', currentLang))
    }
  }

  const processVoiceCommand = async (text: string) => {
    const lowerText = text.toLowerCase()

    // Translate to English for command detection if not in English
    let commandText = lowerText
    if (!selectedLanguage.startsWith('en')) {
      try {
        const translated = await TranslationService.translate(text, 'en', selectedLanguage.split('-')[0])
        commandText = translated.translatedText.toLowerCase()
      } catch (error) {
        console.error('Translation failed:', error)
      }
    }

    // Voice command routing with actual navigation
    if (commandText.includes('weather') || commandText.includes('temperature') || commandText.includes('rain')) {
      // Navigate to weather tab
      const dashboardTabs = document.querySelectorAll('button')
      const weatherButton = Array.from(dashboardTabs).find(btn => 
        btn.textContent?.toLowerCase().includes('weather')
      )
      if (weatherButton) {
        weatherButton.click()
      }
      await speak('Opening weather information')
    } else if (commandText.includes('crop') || commandText.includes('farm') || commandText.includes('field')) {
      // Navigate to crops tab
      const dashboardTabs = document.querySelectorAll('button')
      const cropsButton = Array.from(dashboardTabs).find(btn => 
        btn.textContent?.toLowerCase().includes('home') || btn.textContent?.toLowerCase().includes('crop')
      )
      if (cropsButton) {
        cropsButton.click()
      }
      await speak('Opening your crops')
    } else if (commandText.includes('market') || commandText.includes('price') || commandText.includes('mandi')) {
      // Navigate to market tab
      const dashboardTabs = document.querySelectorAll('button')
      const marketButton = Array.from(dashboardTabs).find(btn => 
        btn.textContent?.toLowerCase().includes('market')
      )
      if (marketButton) {
        marketButton.click()
      }
      await speak('Opening market prices')
    } else if (commandText.includes('learn') || commandText.includes('knowledge') || commandText.includes('help')) {
      // Navigate to learn tab
      const dashboardTabs = document.querySelectorAll('button')
      const learnButton = Array.from(dashboardTabs).find(btn => 
        btn.textContent?.toLowerCase().includes('learn')
      )
      if (learnButton) {
        learnButton.click()
      }
      await speak('Opening knowledge center')
    } else if (commandText.includes('diagnosis') || commandText.includes('disease') || commandText.includes('problem')) {
      // Trigger diagnosis modal
      const event = new CustomEvent('openCropDiagnosis')
      window.dispatchEvent(event)
      await speak('Opening crop diagnosis')
    } else if (commandText.includes('chat') || commandText.includes('assistant') || commandText.includes('ai')) {
      // Trigger AI assistant
      const event = new CustomEvent('openAIAssistant', { detail: { message: text } })
      window.dispatchEvent(event)
      await speak('Opening AI assistant for your question')
    } else {
      // For any other query, open AI assistant with the question
      const event = new CustomEvent('openAIAssistant', { detail: { message: text } })
      window.dispatchEvent(event)
      await speak('Let me help you with that. Opening AI assistant with your question.')
    }
  }

  const speak = async (text: string) => {
    try {
      // Always speak in the currently selected voice language
      const voiceLang = selectedLanguage
      
      // Translate to user's voice language if needed
      let textToSpeak = text
      if (!voiceLang.startsWith('en')) {
        try {
          const targetLang = voiceLang.split('-')[0] // Extract language code (e.g., 'hi' from 'hi-IN')
          const translated = await TranslationService.translate(text, targetLang, 'en')
          textToSpeak = translated.translatedText
        } catch (error) {
          console.warn('Translation failed, speaking in English:', error)
        }
      }

      // Try Google Cloud TTS first for better quality
      try {
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY
        if (googleApiKey) {
          const audioBlob = await SpeechService.synthesizeWithGoogle(textToSpeak, voiceLang)
          const audio = new Audio(URL.createObjectURL(audioBlob))
          await audio.play()
          return
        }
      } catch (error) {
        console.warn('Google TTS failed, using Web Speech API:', error)
      }

      // Fallback to Web Speech API
      await SpeechService.speakWebSpeech(textToSpeak, voiceLang)
    } catch (error) {
      console.error('Speech synthesis failed:', error)
    }
  }

  const changeLanguage = (lang: string) => {
    setSelectedLanguage(lang)
    storage.setLanguage(lang)
    setShowLanguageMenu(false)
    speak('Language changed')
  }

  return (
    <>
      {/* Voice Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleVoiceCommand}
        disabled={isListening}
        className={`fixed bottom-24 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center z-40 ${
          isListening
            ? 'bg-red-600 animate-pulse'
            : 'bg-gradient-to-r from-purple-600 to-pink-600'
        }`}
        title="Voice Command"
      >
        {isListening ? (
          <MicOff size={28} className="text-white" />
        ) : (
          <Mic size={28} className="text-white" />
        )}
      </motion.button>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-44 right-6 left-6 rounded-2xl shadow-2xl p-4 z-40 ${
              currentLang !== 'en' ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <Volume2 size={20} className="text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="text-xs text-tertiary mb-1">
                  {getTranslation('voice.youSaid', currentLang)}:
                </div>
                <div className="text-primary font-medium">{transcript}</div>
                {selectedLanguage && SpeechService.SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SpeechService.SUPPORTED_LANGUAGES] && (
                  <div className="text-xs text-indigo-600 mt-1">
                    {SpeechService.SUPPORTED_LANGUAGES[selectedLanguage as keyof typeof SpeechService.SUPPORTED_LANGUAGES]}
                  </div>
                )}
              </div>
              <button
                onClick={() => setTranscript('')}
                className="text-tertiary hover:text-secondary"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-28 right-24 glass-effect px-4 py-2 rounded-xl shadow-lg z-40 text-sm font-semibold"
          >
            <div className="flex items-center gap-2">
              <Volume2 size={16} />
              <span>{getTranslation('voice.tryCommands', currentLang)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
