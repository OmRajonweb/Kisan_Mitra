'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { GroqService } from '@/lib/groq'
import { storage } from '@/lib/storage'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'

interface DiagnosisResult {
  crop_name: string;
  health_status: 'Healthy' | 'Diseased';
  disease_name: string;
  symptoms: string[];
  treatment: {
    organic: string[];
    chemical: string[];
    cultural: string[];
  };
  prevention: string[];
  urgency: 'Low' | 'Medium' | 'High';
}

interface CropDiagnosisProps {
  darkMode: boolean
}

export default function CropDiagnosis({ darkMode }: CropDiagnosisProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [retryCount, setRetryCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const groq = new GroqService()
  const MAX_RETRIES = 2
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())

    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }

    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size
      if (file.size > MAX_IMAGE_SIZE) {
        setError(getTranslation('dashboard.cropDiagnosis.imageTooLarge', currentLang) || 'Image too large. Please use an image smaller than 5MB.')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(getTranslation('dashboard.cropDiagnosis.invalidFileType', currentLang) || 'Please upload a valid image file.')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setResult(null)
        setError(null)
        setRetryCount(0)
      }
      reader.onerror = () => {
        setError('Failed to read image file. Please try again.')
      }
      reader.readAsDataURL(file)
    }
  }

  // Compress image to avoid payload limits (Max 1024px, 0.7 quality)
  const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.src = base64Str
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
    })
  }

  const analyzeCrop = async () => {
    if (!image) return

    setIsAnalyzing(true)
    setResult(null)
    setError(null)
    setRetryCount(0)
    setProgress(10)

    try {
      // Step 1: Compress Image
      // Update UI if possible, or just implicit
      const compressedBase64 = await compressImage(image)
      const base64Data = compressedBase64.split(',')[1] // Extract data
      setProgress(30)

      const user = storage.getUser()
      const location = user?.location

      // Map language codes to full names for the AI prompt
      const languageNames: Record<Language, string> = {
        en: 'English',
        hi: 'Hindi (हिंदी)',
        ta: 'Tamil (தமிழ்)',
        te: 'Telugu (తెలుగు)',
        ml: 'Malayalam (മലയാളം)',
        kn: 'Kannada (ಕನ್ನಡ)',
        gu: 'Gujarati (ગુજરાતી)',
        bn: 'Bengali (বাংলা)',
        mr: 'Marathi (मराठी)',
        pa: 'Punjabi (ਪੰਜਾਬੀ)'
      }

      const languageName = languageNames[currentLang] || 'English'

      const prompt = `You are an expert agricultural pathologist. Analyze this crop image carefully.

**IMPORTANT**: Provide your entire response in ${languageName} language. All field values (crop_name, disease_name, symptoms, treatment, prevention) must be in ${languageName}.

Provide your analysis in this EXACT JSON format:
{
  "crop_name": "Name of the crop in ${languageName}",
  "health_status": "Healthy" or "Diseased",
  "disease_name": "Name of disease if diseased, otherwise 'None' (in ${languageName})",
  "symptoms": ["symptom 1 in ${languageName}", "symptom 2 in ${languageName}"],
  "treatment": {
    "organic": ["organic solution 1 in ${languageName}", "organic solution 2 in ${languageName}"],
    "chemical": ["chemical solution 1 in ${languageName}", "chemical solution 2 in ${languageName}"],
    "cultural": ["cultural practice 1 in ${languageName}", "cultural practice 2 in ${languageName}"]
  },
  "prevention": ["prevention tip 1 in ${languageName}", "prevention tip 2 in ${languageName}"],
  "urgency": "Low", "Medium", or "High"
}

Be specific and practical. Respond ONLY with valid JSON.`

      let success = false
      let attempts = 0
      let finalParsedResult: DiagnosisResult | null = null

      while (attempts <= MAX_RETRIES && !success) {
        try {
          attempts++
          if (attempts > 1) {
            setRetryCount(attempts - 1)
            await new Promise(resolve => setTimeout(resolve, 1500)) // Wait before retry
          }

          setProgress(40 + (attempts * 10)) // Visual progress

          const response = await groq.analyzeCropImage(base64Data, prompt, currentLang, location)
          console.log(`Attempt ${attempts} Raw Response:`, response)

          // Try parsing
          const cleanResponse = response
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*$/, '$1')
            .trim()

          finalParsedResult = JSON.parse(cleanResponse)

          // Validate
          if (finalParsedResult && finalParsedResult.crop_name && finalParsedResult.health_status) {
            success = true
          } else {
            throw new Error('Incomplete JSON response')
          }

        } catch (e) {
          console.warn(`Attempt ${attempts} failed:`, e)
          if (attempts > MAX_RETRIES) {
            throw e // Throw only on final failure
          }
        }
      }

      if (success && finalParsedResult) {
        setProgress(100)
        setResult(finalParsedResult)
      } else {
        throw new Error('Analysis failed after retries')
      }

    } catch (error) {
      console.error('Final Analysis error:', error)
      setError(
        getTranslation('dashboard.cropDiagnosis.analysisFailedRetry', currentLang) ||
        'Failed to analyze image. Please ensure the photo is clear and try again.'
      )
      setResult(null)
    } finally {
      setIsAnalyzing(false)
      setProgress(0)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="mb-6">
        <h2 className={`text-3xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Camera className="text-green-600" size={36} />
          {getTranslation('dashboard.cropDiagnosis.title', currentLang)}
        </h2>
        <p className={`text-lg mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {getTranslation('dashboard.cropDiagnosis.description', currentLang)}
        </p>
      </div>

      <div className={`glass-effect rounded-3xl p-4 sm:p-6 shadow-xl ${darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-800'}`}>
        {/* Camera input - opens camera on mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* File input - opens file explorer */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {!image ? (
          <div className="space-y-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => cameraInputRef.current?.click()}
              className="w-full btn-primary py-6 text-xl flex items-center justify-center gap-3"
            >
              <Camera size={32} />
              {getTranslation('diagnosis.takePhoto', currentLang)}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full btn-secondary py-6 text-xl flex items-center justify-center gap-3"
            >
              <Upload size={32} />
              {getTranslation('diagnosis.uploadFromGallery', currentLang)}
            </motion.button>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-blue-800 font-semibold mb-2">{getTranslation('diagnosis.tipsTitle', currentLang)}</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>{getTranslation('diagnosis.tip1', currentLang)}</li>
                <li>{getTranslation('diagnosis.tip2', currentLang)}</li>
                <li>{getTranslation('diagnosis.tip3', currentLang)}</li>
                <li>{getTranslation('diagnosis.tip4', currentLang)}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={getTranslation('diagnosis.cropImageAlt', currentLang)}
                className="w-full h-auto max-h-96 object-contain bg-gray-100"
              />
              <button
                onClick={() => {
                  setImage(null)
                  setResult(null)
                }}
                className="absolute top-4 right-4 p-3 bg-red-600 text-white rounded-xl shadow-lg"
              >
                {getTranslation('diagnosis.remove', currentLang)}
              </button>
            </div>

            {!result && !isAnalyzing && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => analyzeCrop()}
                className="w-full btn-primary py-6 text-xl flex items-center justify-center gap-3"
              >
                <Sparkles size={32} />
                {getTranslation('diagnosis.analyzeWithAI', currentLang)}
              </motion.button>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="animate-spin text-green-600" size={48} />
                <p className="text-lg font-semibold text-gray-700">
                  {retryCount > 0
                    ? `${getTranslation('diagnosis.retrying', currentLang) || 'Retrying'} (${retryCount}/${MAX_RETRIES})...`
                    : getTranslation('diagnosis.analyzing', currentLang)
                  }
                </p>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{getTranslation('diagnosis.analyzingSubtext', currentLang)}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative flex items-center gap-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3 text-green-600 font-bold text-xl mb-4">
                  <CheckCircle size={28} />
                  {getTranslation('diagnosis.analysisComplete', currentLang)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                    <h3 className="font-semibold text-green-800 mb-1">Crop</h3>
                    <p className="text-xl font-bold text-green-900">{result.crop_name}</p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${result.health_status === 'Diseased' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <h3 className={`font-semibold mb-1 ${result.health_status === 'Diseased' ? 'text-red-800' : 'text-green-800'}`}>Health Status</h3>
                    <p className={`text-xl font-bold ${result.health_status === 'Diseased' ? 'text-red-900' : 'text-green-900'}`}>{result.health_status}</p>
                  </div>

                  {result.health_status === 'Diseased' && (
                    <div className="col-span-1 md:col-span-2 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                      <h3 className="font-semibold text-orange-800 mb-1">Diagnosis</h3>
                      <p className="text-lg font-bold text-orange-900">{result.disease_name}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Urgency:</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${result.urgency === 'High' ? 'bg-red-200 text-red-800' :
                          result.urgency === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-green-200 text-green-800'
                          }`}>
                          {result.urgency}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <AlertCircle size={18} /> Symptoms
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      {result.symptoms.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {result.health_status === 'Diseased' && (
                    <div className="col-span-1 md:col-span-2 space-y-4">
                      <h3 className="font-semibold text-gray-900 text-lg">Recommended Treatment</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                          <h4 className="font-semibold text-blue-800 mb-2">Organic</h4>
                          <ul className="list-disc pl-4 text-sm text-blue-900 space-y-1">
                            {result.treatment.organic.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                          <h4 className="font-semibold text-purple-800 mb-2">Chemical</h4>
                          <ul className="list-disc pl-4 text-sm text-purple-900 space-y-1">
                            {result.treatment.chemical.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2 bg-teal-50 p-5 rounded-2xl border border-teal-100">
                    <h3 className="font-semibold text-teal-800 mb-2">Prevention</h3>
                    <ul className="list-disc pl-5 text-teal-900 space-y-1">
                      {result.prevention.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setImage(null)
                      setResult(null)
                    }}
                    className="flex-1 btn-secondary py-5 text-lg"
                  >
                    Analyze Another
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      navigator.share?.({
                        title: 'Crop Diagnosis Report',
                        text: `Diagnosis: ${result.disease_name}\nHealth: ${result.health_status}`,
                      })
                    }}
                    className="flex-1 btn-primary py-5 text-lg"
                  >
                    Share Report
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 glass-effect rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-orange-600 flex-shrink-0" size={24} />
          <div>
            <p className="text-sm text-gray-600">
              {getTranslation('dashboard.cropDiagnosis.note', currentLang)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function parseMarkdownResponse(text: string): DiagnosisResult {
  const extractSection = (header: string): string => {
    const regex = new RegExp(`## \\*\\*${header}\\*\\*[\\s\\S]*?([\\s\\S]*?)(?=\\n##|$)`, 'i')
    const match = text.match(regex)
    return match ? match[1].trim() : ''
  }

  const extractList = (header: string): string[] => {
    const section = extractSection(header)
    return section
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*|-\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  const treatmentSection = extractSection('Treatment')

  // Helper to extract subsections from treatment
  const extractTreatment = (subHeader: string): string[] => {
    const regex = new RegExp(`### \\*\\*${subHeader}\\*\\*[\\s\\S]*?([\\s\\S]*?)(?=\\n###|$)`, 'i')
    const match = treatmentSection.match(regex)
    if (!match) return []
    return match[1]
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*|-\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  return {
    crop_name: extractSection('Crop Identification').split('\n')[0] || 'Unknown Crop',
    health_status: extractSection('Health Status').toLowerCase().includes('healthy') ? 'Healthy' : 'Diseased',
    disease_name: extractSection('Disease/Issue Detected').split('\n')[0] || 'Unknown Issue',
    symptoms: extractList('Symptoms'),
    treatment: {
      organic: extractTreatment('Organic Solutions'),
      chemical: extractTreatment('Chemical Pesticides/Fungicides'),
      cultural: extractTreatment('Cultural Practices')
    },
    prevention: extractList('Prevention'),
    urgency: extractSection('Urgency').toLowerCase().includes('high') ? 'High' :
      extractSection('Urgency').toLowerCase().includes('medium') ? 'Medium' : 'Low'
  }
}
