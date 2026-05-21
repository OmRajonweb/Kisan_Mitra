'use client'

import { useState, useEffect, useMemo, type ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sprout,
  Sun,
  Cloud,
  Droplets,
  TrendingUp,
  User,
  MapPin,
  Smartphone,
  ChevronRight,
  CheckCircle,
  Globe,
  BellRing,
  Briefcase,
  GraduationCap,
  Tractor,
  Wheat,
  Leaf
} from 'lucide-react'
import {
  languages,
  type Language,
  getTranslation,
  setCurrentLanguage as setAppLanguage,
  getCurrentLanguage,
} from '@/lib/i18n'
import { NotificationService } from '@/lib/notification'
import { storage } from '@/lib/storage'

interface OnboardingFlowProps {
  onComplete: (userData?: any) => void
}

type StepType = 'language' | 'role' | 'crops' | 'cropDetails' | 'tour' | 'profile' | 'success'

const COMMON_CROPS = [
  { id: 'wheat', name: { en: 'Wheat', hi: 'गेहूं', ta: 'கோதுமை' }, icon: Wheat },
  { id: 'paddy', name: { en: 'Paddy (Rice)', hi: 'धान', ta: 'நெல்' }, icon: Sprout },
  { id: 'cotton', name: { en: 'Cotton', hi: 'कपास', ta: 'பருத்தி' }, icon: Cloud }, // Cotton looks like cloud
  { id: 'sugarcane', name: { en: 'Sugarcane', hi: 'गन्ना', ta: 'கரும்பு' }, icon: Sprout },
  { id: 'tomato', name: { en: 'Tomato', hi: 'टमाटर', ta: 'தக்காளி' }, icon: Leaf },
  { id: 'potato', name: { en: 'Potato', hi: 'आलू', ta: 'உருளைக்கிழங்கு' }, icon: Leaf },
  { id: 'onion', name: { en: 'Onion', hi: 'प्याज', ta: 'வெங்காயம்' }, icon: Leaf },
]

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<StepType>('language')
  const [tourIndex, setTourIndex] = useState(0)
  const [currentLanguage, setCurrentLang] = useState<Language>('en')

  const [formData, setFormData] = useState({
    role: '',
    selectedCrops: [] as Array<{
      id: string
      name: string
      plantedDate: string
      expectedHarvestDate: string
      landSize: string
    }>,
    name: '',
    location: '',
    farmSize: '',
  })

  const [tempCropSelections, setTempCropSelections] = useState<string[]>([])
  const [currentCropIndex, setCurrentCropIndex] = useState(0)
  const [currentCropForm, setCurrentCropForm] = useState({
    plantedDate: '',
    expectedHarvestDate: '',
    landSize: ''
  })

  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  useEffect(() => {
    const savedLang = getCurrentLanguage()
    setCurrentLang(savedLang)

    const storedUser = storage.getUser()
    if (storedUser) {
      setFormData({
        role: storedUser.role || '',
        selectedCrops: [], // Don't load from storage, will be collected fresh
        name: storedUser.name || '',
        location: storedUser.location || '',
        farmSize: storedUser.farmSize || '',
      })
    }
  }, [])

  const handleLanguageSelect = (lang: Language) => {
    setCurrentLang(lang)
    setAppLanguage(lang)
    setStep('role')
  }

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }))
    setStep('crops')
  }

  const toggleCrop = (cropId: string) => {
    setTempCropSelections(prev =>
      prev.includes(cropId)
        ? prev.filter(c => c !== cropId)
        : [...prev, cropId]
    )
  }

  const proceedToCropDetails = () => {
    if (tempCropSelections.length === 0) {
      alert(getTranslation('onboarding.selectAtLeastOne', currentLanguage) || 'Please select at least one crop')
      return
    }
    setCurrentCropIndex(0)
    setStep('cropDetails')
  }

  const saveCropDetails = () => {
    if (!currentCropForm.plantedDate || !currentCropForm.expectedHarvestDate || !currentCropForm.landSize) {
      alert(getTranslation('onboarding.fillAllFields', currentLanguage))
      return
    }

    const cropId = tempCropSelections[currentCropIndex]
    const cropData = COMMON_CROPS.find(c => c.id === cropId)
    const cropName = (cropData?.name as any)?.[currentLanguage] || cropId

    const newCrop = {
      id: cropId,
      name: cropName,
      plantedDate: currentCropForm.plantedDate,
      expectedHarvestDate: currentCropForm.expectedHarvestDate,
      landSize: currentCropForm.landSize
    }

    setFormData(prev => ({
      ...prev,
      selectedCrops: [...prev.selectedCrops, newCrop]
    }))

    // Move to next crop or finish
    if (currentCropIndex < tempCropSelections.length - 1) {
      setCurrentCropIndex(prev => prev + 1)
      setCurrentCropForm({ plantedDate: '', expectedHarvestDate: '', landSize: '' })
    } else {
      setStep('tour')
    }
  }

  const nextTourSlide = () => {
    if (tourIndex < 2) { // 3 slides (0-2)
      setTourIndex(prev => prev + 1)
    } else {
      setStep('profile')
    }
  }

  const handleFinish = () => {
    // Save crop IDs to user.crops for backward compatibility
    const cropIds = formData.selectedCrops.map(c => c.id)

    storage.setUser({
      ...formData,
      language: currentLanguage,
      crops: cropIds
    })
    storage.setOnboarded(true)

    // We will trigger confetti in the Success component via useEffect
    setStep('success')

    setTimeout(() => {
      onComplete(formData)
    }, 2000)
  }

  // --- Render Steps ---

  const renderLanguage = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }}
      className="max-w-4xl w-full mx-auto p-6"
    >
      <div className="text-center mb-10">
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full flex items-center justify-center"
        >
          <Globe className="text-white w-10 h-10" />
        </motion.div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 mb-2">
          {getTranslation('onboarding.selectLanguage', currentLanguage)}
        </h1>
        <p className="text-gray-500">{getTranslation('onboarding.languageDescription', currentLanguage)}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {languages.map(lang => (
          <motion.button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${currentLanguage === lang.code
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-transparent bg-white dark:bg-gray-800 shadow-sm hover:shadow-md'
              }`}
          >
            <span className="text-3xl">{lang.flag}</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{lang.nativeName}</span>
            <span className="text-xs text-gray-400">{lang.name}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )

  const renderRole = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      className="max-w-2xl w-full mx-auto p-6"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {getTranslation('onboarding.roles.title', currentLanguage)}
        </h2>
        <p className="text-gray-500">{getTranslation('onboarding.roles.subtitle', currentLanguage)}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'farmer', icon: Tractor, label: getTranslation('onboarding.roles.farmer', currentLanguage) },
          { id: 'trader', icon: Briefcase, label: getTranslation('onboarding.roles.trader', currentLanguage) },
          { id: 'student', icon: GraduationCap, label: getTranslation('onboarding.roles.student', currentLanguage) },
        ].map(role => (
          <motion.button
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            whileHover={{ y: -5 }}
            className={`p-6 rounded-3xl border-2 transition-all text-center group ${formData.role === role.id
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
              : 'border-transparent bg-white dark:bg-gray-800 shadow-md hover:shadow-xl'
              }`}
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white ${formData.role === role.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
              <role.icon size={32} />
            </div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{role.label}</h3>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )

  const renderCrops = () => (
    <motion.div className="max-w-2xl w-full mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">{getTranslation('onboarding.selectCrops.title', currentLanguage)}</h2>
        <p className="text-gray-500">{getTranslation('onboarding.selectCrops.subtitle', currentLanguage)}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {COMMON_CROPS.map(crop => {
          const isSelected = tempCropSelections.includes(crop.id)
          // Rough translation fallback
          const name = (crop.name as any)[currentLanguage] || crop.name.en

          return (
            <motion.button
              key={crop.id}
              onClick={() => toggleCrop(crop.id)}
              whileTap={{ scale: 0.9 }}
              className={`px-4 py-2 rounded-full flex items-center gap-2 border transition-all ${isSelected
                ? 'bg-green-600 text-white border-green-600 shadow-md'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-400'
                }`}
            >
              <crop.icon size={16} />
              <span>{name}</span>
              {isSelected && <CheckCircle size={14} />}
            </motion.button>
          )
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={proceedToCropDetails}
        disabled={tempCropSelections.length === 0}
        className="w-full btn-primary py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getTranslation('onboarding.next', currentLanguage)}
      </motion.button>
    </motion.div>
  )

  const renderCropDetails = () => {
    const currentCropId = tempCropSelections[currentCropIndex]
    const cropData = COMMON_CROPS.find(c => c.id === currentCropId)
    const cropName = (cropData?.name as any)?.[currentLanguage] || currentCropId
    const CropIcon = cropData?.icon || Leaf
    const isLastCrop = currentCropIndex === tempCropSelections.length - 1

    return (
      <motion.div className="max-w-2xl w-full mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CropIcon size={40} className="text-green-600" />
            <h2 className="text-3xl font-bold">
              {getTranslation('onboarding.cropDetails.title', currentLanguage)} {cropName}
            </h2>
          </div>
          <p className="text-gray-500">{getTranslation('onboarding.cropDetails.subtitle', currentLanguage)}</p>
          <p className="text-sm text-gray-400 mt-2">
            Crop {currentCropIndex + 1} of {tempCropSelections.length}
          </p>
        </div>

        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {getTranslation('onboarding.cropDetails.plantedDate', currentLanguage)}
            </label>
            <input
              type="date"
              value={currentCropForm.plantedDate}
              onChange={(e) => setCurrentCropForm(prev => ({ ...prev, plantedDate: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {getTranslation('onboarding.cropDetails.harvestDate', currentLanguage)}
            </label>
            <input
              type="date"
              value={currentCropForm.expectedHarvestDate}
              onChange={(e) => setCurrentCropForm(prev => ({ ...prev, expectedHarvestDate: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {getTranslation('onboarding.cropDetails.landSize', currentLanguage)}
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={currentCropForm.landSize}
              onChange={(e) => setCurrentCropForm(prev => ({ ...prev, landSize: e.target.value }))}
              placeholder="e.g., 2.5"
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-green-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={saveCropDetails}
            className="w-full btn-primary py-4 text-xl"
          >
            {isLastCrop
              ? getTranslation('onboarding.cropDetails.finishCrops', currentLanguage)
              : getTranslation('onboarding.cropDetails.nextCrop', currentLanguage)
            }
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // Reusing existing tour content but simplified
  const renderTour = () => {
    // ... Define slides array similar to original but maybe simpler ...
    const slides = [
      { id: 'weather', icon: Cloud, title: getTranslation('onboarding.slides.weatherTitle', currentLanguage), desc: getTranslation('onboarding.slides.weatherDescription', currentLanguage), color: 'from-blue-400 to-cyan-500' },
      { id: 'market', icon: TrendingUp, title: getTranslation('onboarding.slides.marketTitle', currentLanguage), desc: getTranslation('onboarding.slides.marketDescription', currentLanguage), color: 'from-purple-400 to-pink-500' },
      { id: 'ai', icon: Smartphone, title: getTranslation('onboarding.slides.aiTitle', currentLanguage), desc: getTranslation('onboarding.slides.aiDescription', currentLanguage), color: 'from-indigo-400 to-purple-500' },
    ]
    const currentSlide = slides[tourIndex]
    const Icon = currentSlide.icon

    return (
      <motion.div
        key={tourIndex}
        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
        className="max-w-md w-full mx-auto p-8 rounded-3xl glass-effect shadow-2xl text-center"
      >
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${currentSlide.color} flex items-center justify-center shadow-lg`}>
          <Icon size={48} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{currentSlide.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{currentSlide.desc}</p>

        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === tourIndex ? 'w-8 bg-green-500' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>

        <button onClick={nextTourSlide} className="btn-primary w-full py-4 rounded-xl">
          {tourIndex < slides.length - 1 ? getTranslation('onboarding.next', currentLanguage) : getTranslation('onboarding.getStarted', currentLanguage)}
        </button>
      </motion.div>
    )
  }

  const renderProfile = () => (
    <motion.div className="max-w-md w-full mx-auto p-6 glass-effect rounded-3xl shadow-xl">
      <div className="text-center mb-6">
        <User size={48} className="mx-auto text-green-600 mb-2" />
        <h2 className="text-2xl font-bold">{getTranslation('onboarding.form.title', currentLanguage)}</h2>
      </div>

      <div className="space-y-4 mb-6">
        <input
          value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder={getTranslation('onboarding.form.namePlaceholder', currentLanguage)}
          className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50"
        />
        <input
          value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
          placeholder={getTranslation('onboarding.form.locationPlaceholder', currentLanguage)}
          className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50"
        />
      </div>

      <button
        onClick={handleFinish}
        disabled={!formData.name}
        className="btn-primary w-full py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
      >
        {getTranslation('onboarding.finish', currentLanguage)}
      </button>
    </motion.div>
  )

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-2xl"
      >
        <CheckCircle size={64} className="text-white" />
      </motion.div>
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">All Set!</h2>
      <p className="text-gray-500 mt-2">Redirecting to dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-10 left-10 text-green-200/50"><Sprout size={100} /></motion.div>
        <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 7, repeat: Infinity }} className="absolute bottom-20 right-10 text-blue-200/50"><Cloud size={120} /></motion.div>
      </div>

      <AnimatePresence mode='wait'>
        {step === 'language' && renderLanguage()}
        {step === 'role' && renderRole()}
        {step === 'crops' && renderCrops()}
        {step === 'cropDetails' && renderCropDetails()}
        {step === 'tour' && renderTour()}
        {step === 'profile' && renderProfile()}
        {step === 'success' && renderSuccess()}
      </AnimatePresence>
    </div>
  )
}
