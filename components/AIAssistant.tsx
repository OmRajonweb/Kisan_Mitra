'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mic, MicOff, Loader2, MessageCircle } from 'lucide-react'
import { GroqService } from '@/lib/groq'
import { storage } from '@/lib/storage'
import { TranslationService } from '@/lib/translation'
import { getCurrentLanguage, getTranslation, type Language } from '@/lib/i18n'
import type { ChatMessage } from '@/lib/types'

interface AIAssistantProps {
  onClose: () => void
  initialMessage?: string
  darkMode?: boolean
}

export default function AIAssistant({ onClose, initialMessage, darkMode = false }: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const groq = useMemo(() => new GroqService(), [])
  const hasProcessedInitialMessage = useRef(false)

  useEffect(() => {
    // Get current app language
    const appLang = getCurrentLanguage()
    setCurrentLang(appLang)

    // Get or set voice language based on app language
    const savedLang = storage.getLanguage()
    if (savedLang) {
      setSelectedLanguage(savedLang)
    } else {
      const voiceLang = `${appLang}-IN`
      setSelectedLanguage(voiceLang)
      storage.setLanguage(voiceLang)
    }

    // Listen for language changes
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage()
      setCurrentLang(newLang)

      // Sync voice language with app language
      const newVoiceLang = `${newLang}-IN`
      setSelectedLanguage(newVoiceLang)
      storage.setLanguage(newVoiceLang)
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  useEffect(() => {
    // Load chat history and user data
    const history = storage.getChatHistory()
    const userData = storage.getUser()
    const crops = storage.getCrops()

    if (history.length > 0) {
      setMessages(history)
    } else {
      // Welcome message in user's language
      const welcomeText = getTranslation('ai.welcomeMessage', currentLang)
      const helpText = getTranslation('ai.canHelpWith', currentLang)

      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `${welcomeText.replace('{name}', userData?.name || '')} 🌱\n\n${helpText}\n\n${crops.length > 0 ? `\n${getTranslation('ai.seeingCrops', currentLang).replace('{crops}', crops.map(c => c.name).join(', '))}` : ''}\n\n${getTranslation('ai.howCanHelp', currentLang)}`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }

  }, [currentLang])

  // Separate useEffect for processing initial message to avoid dependency issues
  useEffect(() => {
    if (initialMessage && !hasProcessedInitialMessage.current) {
      hasProcessedInitialMessage.current = true
      setTimeout(() => {
        setInput(initialMessage)
        // Call handleSendMessage after it's defined
        const sendMessage = async () => {
          if (!isLoading) {
            const message: ChatMessage = {
              id: Date.now().toString(),
              role: 'user',
              content: initialMessage,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, message])
            setIsLoading(true)

            try {
              const geminiMessages: any[] = [{ role: 'user', parts: [{ text: initialMessage }] }]
              const response = await groq.chat(geminiMessages, currentLang)
              const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date(),
              }
              setMessages((prev) => [...prev, assistantMessage])
            } catch (error) {
              console.error('Gemini API error:', error)
            } finally {
              setIsLoading(false)
            }
          }
        }
        sendMessage()
      }, 500)
    }
  }, [initialMessage, currentLang, groq, isLoading])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    storage.addChatMessage(userMessage)
    setInput('')
    setIsLoading(true)

    try {
      // Get all user context
      const userData = storage.getUser()
      const crops = storage.getCrops()

      // Build context for Gemini
      let contextPrompt = textToSend
      if (userData || crops.length > 0) {
        contextPrompt = `Context about the farmer:\n`
        if (userData) {
          contextPrompt += `- Name: ${userData.name}\n- Location: ${userData.location}\n- Farm size: ${userData.farmSize} acres\n`
        }
        if (crops.length > 0) {
          contextPrompt += `- Current crops: ${crops.map(c => `${c.name} (planted ${c.plantedDate})`).join(', ')}\n`
        }
        contextPrompt += `\nFarmer's question: ${textToSend}`
      }

      // Convert chat history to Gemini format
      const geminiMessages = messages
        .filter((m) => m.role !== 'assistant' || !m.content.includes('Hello'))
        .map((m) => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }],
        }))

      geminiMessages.push({
        role: 'user',
        parts: [{ text: contextPrompt }],
      })

      // Get response directly in user's language
      const response = await groq.chat(geminiMessages, currentLang, userData?.location)
      const translatedResponse = response

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: translatedResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      storage.addChatMessage(assistantMessage)
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getTranslation('ai.error', currentLang),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, currentLang, groq])

  const handleSend = () => handleSendMessage()

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(getTranslation('ai.voiceNotSupported', currentLang))
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // Use selected voice language for recognition
    recognition.lang = selectedLanguage
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      alert(getTranslation('ai.voiceError', currentLang))
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const formatMessage = (content: string) => {
    // Better text formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.match(/^#{1,3}\s/)) {
          const level = line.match(/^(#{1,3})/)?.[0].length || 1
          const text = line.replace(/^#{1,3}\s/, '')
          const sizes = ['text-2xl', 'text-xl', 'text-lg']
          return <div key={i} className={`${sizes[level - 1]} font-bold mt-4 mb-2`}>{text}</div>
        }
        // Bullet points
        if (line.match(/^[•\-\*]\s/)) {
          const text = line.replace(/^[•\-\*]\s/, '')
          return <div key={i} className="flex gap-2 ml-4 my-1"><span>•</span><span>{text}</span></div>
        }
        // Numbered lists
        if (line.match(/^\d+\.\s/)) {
          return <div key={i} className="ml-4 my-1">{line}</div>
        }
        // Bold text
        if (line.match(/\*\*(.*?)\*\*/)) {
          const parts = line.split(/(\*\*.*?\*\*)/)
          return (
            <div key={i} className="my-1">
              {parts.map((part, j) =>
                part.startsWith('**') ?
                  <strong key={j}>{part.replace(/\*\*/g, '')}</strong> :
                  part
              )}
            </div>
          )
        }
        // Empty lines
        if (!line.trim()) return <div key={i} className="h-2"></div>
        // Regular text
        return <div key={i} className="my-1">{line}</div>
      })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full md:max-w-2xl h-[85vh] md:h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col glass-effect"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageCircle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">{getTranslation('dashboard.aiAssistant', currentLang)}</h2>
                <p className="text-sm text-green-100">{getTranslation('ai.askAnything', currentLang)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={getTranslation('common.close', currentLang)}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'user'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-br-sm'
                    : 'glass-effect text-primary rounded-bl-sm shadow-md'
                    }`}
                >
                  <div className="text-base leading-relaxed">{formatMessage(message.content)}</div>
                  <p
                    className={`text-xs mt-2 ${message.role === 'user' ? 'text-green-100' : 'text-tertiary'
                      }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="glass-effect p-4 rounded-2xl rounded-bl-sm">
                  <Loader2 className="animate-spin text-green-600" size={24} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 glass-effect">
            <div className="flex items-center gap-2">
              <button
                onClick={handleVoiceInput}
                disabled={isListening || isLoading}
                aria-label={isListening ? getTranslation('voice.stopListening', currentLang) : getTranslation('voice.startListening', currentLang)}
                className={isListening ? 'p-4 rounded-xl transition-colors bg-red-600 text-white' : 'btn-secondary p-4'}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={getTranslation('ai.typeQuestion', currentLang)}
                className="input flex-1 text-lg"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label={getTranslation('common.send', currentLang)}
                className="btn-primary p-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
