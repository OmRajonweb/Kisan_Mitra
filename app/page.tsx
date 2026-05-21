'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingFlow from '@/components/OnboardingFlow'
import { storage } from '@/lib/storage'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentLang, setCurrentLang] = useState<Language>('en')

  useEffect(() => {
    setCurrentLang(getCurrentLanguage())

    // Small delay to ensure localStorage is available
    const timer = setTimeout(() => {
      const hasCompletedOnboarding = storage.isOnboarded()

      if (!hasCompletedOnboarding) {
        setShowOnboarding(true)
      } else {
        router.push('/dashboard')
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [router])

  const handleOnboardingComplete = (userData?: any) => {
    storage.setOnboarded(true)
    if (userData) {
      storage.setUser(userData)

      // Create Crop objects from detailed onboarding data
      if (userData.selectedCrops && Array.isArray(userData.selectedCrops) && userData.selectedCrops.length > 0) {
        userData.selectedCrops.forEach((cropData: any) => {
          const plantedDate = new Date(cropData.plantedDate)
          const harvestDate = new Date(cropData.expectedHarvestDate)
          const today = new Date()

          // Calculate progress and days to harvest
          const totalDays = Math.ceil((harvestDate.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24))
          const daysElapsed = Math.ceil((today.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24))
          const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
          const daysToHarvest = Math.max(totalDays - daysElapsed, 0)

          const newCrop = {
            id: `${Date.now()}-${Math.random()}-${cropData.id}`,
            name: cropData.name,
            plantedDate: cropData.plantedDate,
            expectedHarvestDate: cropData.expectedHarvestDate,
            status: 'healthy' as const,
            progress: Math.round(progress),
            daysToHarvest,
            notes: `Land size: ${cropData.landSize} acres`
          }
          storage.addCrop(newCrop)
        })
      }
    }
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
        <p className="text-gray-600 font-semibold">{getTranslation('common.loading', currentLang)}</p>
      </div>
    )
  }

  if (!showOnboarding) {
    return null
  }

  return <OnboardingFlow onComplete={handleOnboardingComplete} />
}
