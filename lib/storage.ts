// lib/storage.ts - LocalStorage utilities
import { UserProfile, Crop, ChatMessage } from './types'

export const storage = {
  // User Profile
  getUser(): UserProfile | null {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem('kisanMitraUser')
    return data ? JSON.parse(data) : null
  },

  setUser(user: UserProfile): void {
    localStorage.setItem('kisanMitraUser', JSON.stringify(user))
  },

  // Crops
  getCrops(): Crop[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem('kisanMitraCrops')
    return data ? JSON.parse(data) : []
  },

  setCrops(crops: Crop[]): void {
    localStorage.setItem('kisanMitraCrops', JSON.stringify(crops))
  },

  addCrop(crop: Crop): void {
    const crops = this.getCrops()
    crops.push(crop)
    this.setCrops(crops)
  },

  updateCrop(id: string, updates: Partial<Crop>): void {
    const crops = this.getCrops()
    const index = crops.findIndex((c) => c.id === id)
    if (index !== -1) {
      crops[index] = { ...crops[index], ...updates }
      this.setCrops(crops)
    }
  },

  deleteCrop(id: string): void {
    const crops = this.getCrops()
    this.setCrops(crops.filter((c) => c.id !== id))
  },

  // Chat History
  getChatHistory(): ChatMessage[] {
    if (typeof window === 'undefined') return []
    const data = localStorage.getItem('kisanMitraChatHistory')
    return data ? JSON.parse(data) : []
  },

  setChatHistory(messages: ChatMessage[]): void {
    localStorage.setItem('kisanMitraChatHistory', JSON.stringify(messages))
  },

  addChatMessage(message: ChatMessage): void {
    const history = this.getChatHistory()
    history.push(message)
    // Keep only last 50 messages
    if (history.length > 50) {
      history.shift()
    }
    this.setChatHistory(history)
  },

  clearChatHistory(): void {
    localStorage.setItem('kisanMitraChatHistory', JSON.stringify([]))
  },

  // Onboarding
  isOnboarded(): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('kisanMitraOnboarded') === 'true'
  },

  setOnboarded(value: boolean): void {
    localStorage.setItem('kisanMitraOnboarded', String(value))
  },

  // Language
  getLanguage(): string {
    if (typeof window === 'undefined') return 'en-IN'
    return localStorage.getItem('kisanMitraVoiceLanguage') || 'en-IN'
  },

  setLanguage(lang: string): void {
    localStorage.setItem('kisanMitraVoiceLanguage', lang)
  },

  // AI Insight Cache
  getAiInsight(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('kisanMitraAiInsight')
  },

  setAiInsight(insight: string): void {
    localStorage.setItem('kisanMitraAiInsight', insight)
  },
}
