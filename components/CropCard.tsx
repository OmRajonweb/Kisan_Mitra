'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sprout, Calendar, AlertCircle, Plus, X, Edit2, Trash2 } from 'lucide-react'
import { storage } from '@/lib/storage'
import type { Crop } from '@/lib/types'
import { getTranslation, getCurrentLanguage, type Language } from '@/lib/i18n'

interface CropCardProps {
  darkMode?: boolean
}

export default function CropCard({ darkMode = false }: CropCardProps) {
  const [crops, setCrops] = useState<Crop[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)
  const [currentLang, setCurrentLang] = useState<Language>('en')
  const [formData, setFormData] = useState({
    name: '',
    plantedDate: '',
    expectedHarvestDate: '',
    notes: '',
  })

  // Popular crop types with emojis
  const cropTypes = [
    { nameKey: 'wheat', emoji: '🌾' },
    { nameKey: 'rice', emoji: '🌾' },
    { nameKey: 'tomato', emoji: '🍅' },
    { nameKey: 'corn', emoji: '🌽' },
    { nameKey: 'potato', emoji: '🥔' },
    { nameKey: 'onion', emoji: '🧅' },
    { nameKey: 'cotton', emoji: '🌱' },
    { nameKey: 'sugarcane', emoji: '🎋' },
    { nameKey: 'other', emoji: '🌿' },
  ]

  useEffect(() => {
    loadCrops()
    setCurrentLang(getCurrentLanguage())
    
    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage())
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  const loadCrops = () => {
    const storedCrops = storage.getCrops()
    setCrops(storedCrops)
  }

  const handleAddCrop = () => {
    if (!formData.name || !formData.plantedDate || !formData.expectedHarvestDate) {
      alert('Please fill all required fields')
      return
    }

    const plantedDate = new Date(formData.plantedDate)
    const harvestDate = new Date(formData.expectedHarvestDate)
    
    if (harvestDate <= plantedDate) {
      alert('Harvest date must be after planted date')
      return
    }

    const totalDays = Math.ceil((harvestDate.getTime() - plantedDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.ceil((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24))
    const progress = Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
    const daysToHarvest = Math.max(totalDays - daysElapsed, 0)

    let status: 'healthy' | 'needs-attention' | 'disease' = 'healthy'
    if (progress > 90) status = 'healthy'
    else if (progress > 50) status = 'healthy'
    else status = 'healthy'

    if (editingCrop) {
      // Update existing crop
      const updatedCrop: Crop = {
        ...editingCrop,
        name: formData.name,
        plantedDate: formData.plantedDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        status,
        progress: Math.round(progress),
        daysToHarvest,
        notes: formData.notes,
      }
      storage.updateCrop(editingCrop.id, updatedCrop)
      setEditingCrop(null)
    } else {
      // Add new crop
      const newCrop: Crop = {
        id: Date.now().toString(),
        name: formData.name,
        plantedDate: formData.plantedDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        status,
        progress: Math.round(progress),
        daysToHarvest,
        notes: formData.notes,
      }
      storage.addCrop(newCrop)
    }

    loadCrops()
    setShowAddForm(false)
    setFormData({ name: '', plantedDate: '', expectedHarvestDate: '', notes: '' })
  }

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop)
    setFormData({
      name: crop.name,
      plantedDate: crop.plantedDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      notes: crop.notes || '',
    })
    setShowAddForm(true)
  }

  const handleDeleteCrop = (id: string) => {
    if (confirm('Are you sure you want to delete this crop?')) {
      storage.deleteCrop(id)
      loadCrops()
    }
  }

  const getCropColor = (name: string) => {
    const colors: Record<string, string> = {
      wheat: 'from-yellow-400 to-orange-500',
      rice: 'from-green-400 to-emerald-500',
      tomato: 'from-red-400 to-pink-500',
      corn: 'from-yellow-300 to-amber-500',
      potato: 'from-amber-400 to-orange-500',
      onion: 'from-purple-400 to-pink-400',
    }
    const key = name.toLowerCase()
    return colors[key] || 'from-green-400 to-emerald-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'needs-attention':
        return 'text-orange-600'
      case 'disease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          <Sprout className="text-green-600" size={32} />
          {getTranslation('dashboard.myCrops', currentLang)}
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 shadow-lg text-lg"
        >
          <Plus size={24} />
          {getTranslation('crops.addCrop', currentLang)}
        </motion.button>
      </div>

      {crops.length === 0 ? (
        <div className={`glass-effect rounded-3xl p-12 text-center ${darkMode ? 'bg-gray-800/90' : ''}`}>
          <Sprout className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} size={64} />
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            {getTranslation('crops.noCrops', currentLang)}
          </h3>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {getTranslation('crops.startTracking', currentLang)}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary px-8 py-4 text-lg"
          >
            {getTranslation('crops.addFirstCrop', currentLang)}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {crops.map((crop, index) => (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`glass-effect rounded-3xl p-6 shadow-lg ${darkMode ? 'bg-gray-800/90' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getCropColor(crop.name)} rounded-2xl flex items-center justify-center shadow-md`}>
                    <Sprout size={32} className="text-white" />
                  </div>
                  <div>
                    <h4 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{crop.name}</h4>
                    <p className={`text-lg font-semibold ${getStatusColor(crop.status)}`}>
                      {crop.status.charAt(0).toUpperCase() + crop.status.slice(1).replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCrop(crop)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteCrop(crop.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center justify-between ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="flex items-center gap-2 text-lg">
                    <Calendar size={20} />
                    {getTranslation('crops.daysToHarvest', currentLang)}
                  </span>
                  <span className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>{crop.daysToHarvest}</span>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getTranslation('crops.growthProgress', currentLang)}
                    </span>
                    <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{crop.progress}%</span>
                  </div>
                  <div className={`w-full rounded-full h-3 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${crop.progress}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      className={`h-full bg-gradient-to-r ${getCropColor(crop.name)} rounded-full`}
                    />
                  </div>
                </div>

                {crop.notes && (
                  <div className={`border-2 rounded-xl p-3 ${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{crop.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Crop Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {editingCrop ? 'Edit Crop' : 'Add New Crop'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingCrop(null)
                    setFormData({ name: '', plantedDate: '', expectedHarvestDate: '', notes: '' })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {getTranslation('cropForm.cropTypeLabel', currentLang)}
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {cropTypes.map((crop) => {
                      const cropName = getTranslation(`cropTypes.${crop.nameKey}`, currentLang)
                      return (
                        <button
                          key={crop.nameKey}
                          type="button"
                          onClick={() => setFormData({ ...formData, name: cropName })}
                          className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                            formData.name === cropName
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-green-300'
                          }`}
                        >
                          <span className="text-2xl">{crop.emoji}</span>
                          <span className="text-xs font-semibold">{cropName}</span>
                        </button>
                      )
                    })}
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={getTranslation('cropForm.customCropPlaceholder', currentLang)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {getTranslation('cropForm.plantedDateLabel', currentLang)}
                  </label>
                  <input
                    type="date"
                    value={formData.plantedDate}
                    onChange={(e) => setFormData({ ...formData, plantedDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {getTranslation('cropForm.expectedHarvestLabel', currentLang)}
                  </label>
                  <input
                    type="date"
                    value={formData.expectedHarvestDate}
                    onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {getTranslation('cropForm.notesLabel', currentLang)}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={getTranslation('cropForm.notesPlaceholder', currentLang)}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleAddCrop}
                  className="w-full btn-primary py-4 text-lg"
                >
                  {editingCrop ? getTranslation('cropForm.updateCrop', currentLang) : getTranslation('crops.addCrop', currentLang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
