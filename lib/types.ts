/**
 * lib/types.ts - TypeScript type definitions for Kisan Mitra
 * 
 * This file contains all the core type definitions used throughout
 * the application for type safety and better developer experience.
 */

/**
 * User profile information collected during onboarding
 * and stored in localStorage for personalization.
 */
export interface UserProfile {
  /** Display name of the farmer/user */
  name: string
  /** Location/village of the user */
  location: string
  /** Total farm size (e.g., "5 acres") */
  farmSize: string
  /** Preferred language code (e.g., 'en', 'hi', 'ta') */
  language: string
  /** Type of soil on the farm */
  soilType?: string
  /** List of crops the user is growing */
  crops?: string[]
  /** User role or type */
  role?: string
}

/**
 * Represents a crop being cultivated by the user.
 * Tracks planting dates, harvest info, and health status.
 */
export interface Crop {
  /** Unique identifier for the crop */
  id: string
  /** Name of the crop (e.g., 'Wheat', 'Rice') */
  name: string
  /** ISO date string when crop was planted */
  plantedDate: string
  /** ISO date string for expected harvest */
  expectedHarvestDate: string
  /** Current health status of the crop */
  status: 'healthy' | 'needs-attention' | 'disease'
  /** Growth progress percentage (0-100) */
  progress: number
  /** Number of days until harvest */
  daysToHarvest: number
  /** Additional notes about this crop */
  notes?: string
}

/**
 * Weather data including current conditions and forecast.
 * Used to provide farming-relevant weather insights.
 */
export interface WeatherData {
  /** Current weather conditions */
  current: {
    /** Temperature in Celsius */
    temp: number
    /** Weather condition description */
    condition: string
    /** Humidity percentage */
    humidity: number
    /** Wind speed in km/h */
    wind: number
    /** Rainfall in mm */
    rainfall: number
  }
  /** Weather forecast for upcoming days */
  forecast: Array<{
    /** Day name (e.g., 'Monday') */
    day: string
    /** Expected temperature */
    temp: number
    /** Expected condition */
    condition: string
    /** Weather icon identifier */
    icon: string
  }>
}

/**
 * Market price information for agricultural commodities.
 * Fetched from various mandi APIs.
 */
export interface MarketPrice {
  /** Name of the commodity */
  name: string
  /** Current price per unit */
  price: number
  /** Price change percentage */
  change: number
  /** Price trend direction */
  trend: 'up' | 'down'
  /** Unit of measurement (e.g., 'quintal', 'kg') */
  unit: string
  /** Market/mandi name where this price applies */
  market?: string
}

/**
 * Chat message for AI assistant conversations.
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string
  /** Who sent the message */
  role: 'user' | 'assistant'
  /** Message content */
  content: string
  /** When the message was sent */
  timestamp: Date
}

/**
 * Agricultural input shop information.
 * Includes both government PMKSK centers and private shops.
 */
export interface InputShop {
  /** Unique shop identifier */
  id?: string
  /** Shop/center name */
  name: string
  /** Shop type: government (pmksk) or private */
  type: 'pmksk' | 'private'
  /** Geographic coordinates */
  location?: { lat: number; lng: number }
  /** Distance from user in km */
  distance?: number
  /** Available items with prices */
  items: Array<{
    /** Item name */
    name: string
    /** Price in INR */
    price: number
    /** Last price update date */
    lastUpdated?: Date
  }>
  /** Full address of the shop */
  address: string
  /** Contact phone number */
  phone?: string
  /** Whether the shop is verified */
  verified?: boolean
  /** Customer rating (1-5) */
  rating?: number
}

