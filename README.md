# Kisan Mitra (Farmers' Friend) 

[![Netlify Status](https://api.netlify.com/api/v1/badges/d21a574f-7d90-405c-adbd-15c28bf4126e/deploy-status)](https://app.netlify.com/projects/finhack25/deploys) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) 🌾

> **Tech for Economic Empowerment: Rural Market Support Platform**

Kisan Mitra is an AI-powered agricultural companion designed to empower Indian farmers by bridging the information gap. It provides real-time market intelligence, personalized crop advisory, and economic literacy in **10 Indian languages**.


## 🏆 Innovation & Impact (Why this matters)

**The Problem**: Rural farmers often sell their produce at low rates due to a lack of awareness about nearby mandi prices, government schemes (MSP), and crop cycles. This "Information Asymmetry" costs them 20-30% of their potential income.

**Our Solution**: Kisan Mitra solves this by democratizing access to high-level agricultural & economic data:

1.  **AI That Speaks Your Language**: Powered by **Groq (Llama 3.3)**, our assistant provides voice-enabled advice in Hindi, Tamil, Telugu, Kannada, and 6 other regional languages.
2.  **Profitable Market Finder**: Unlike standard apps that just show prices, we calculate **Net Profit** (Price - Transport Cost) to suggest the *actual* best market for the farmer.
3.  **Visual Crop Doctor**: Just snap a photo of a sick plant, and our Vision AI (Llama 3.2) diagnoses the disease and suggests organic remedies instantly.
4.  **Economic Education**: We break down complex terms like *MSP*, *Supply-Demand*, and *Commodity Cycles* into simple, local-language guides.

## ✨ Key Features

### 🛒 Rural Market Support Platform
-   **Real-Time Mandi Prices**: Live data for 40+ crops across regional markets.
-   **Profitability Calculator**: Input your transport cost (₹/km), and we rank markets by *net profit*.
-   **Price Trend Analysis**: "Good time to sell?" indicators based on historical volatility.

### 🤖 Intelligent Advisory
-   **Multilingual AI Chat**: Ask specific questions ("How to treat rust in wheat?") in your native tongue.
-   **Crop Diagnosis**: Upload an image to detect pests/diseases with 90% accuracy.
-   **Smart Recommendations**: Suggests crops based on Soil Type + Season + Water Availability.

### 📚 Learn & Grow Hub
-   **Economic Literacy**: Simple explainers for MSP, crop insurance, and market trends.
-   **Farming Guides**: Best practices for cultivation, sowing, and harvesting.
-   **Localized Content**: All articles available in 10 languages.

## 🛠️ Tech Stack (Feasibility)

Built with modern, scalable technologies to ensure performance even on low-end devices:

-   **Frontend**: Next.js 14 (App Router), React, TailwindCSS
-   **AI Engine**: Groq Cloud (Llama 3.3 70B, Llama 3.2 Vision) - *chosen for sub-second latency*
-   **Localization**: Custom robust i18n architecture (supports English, Hindi, Tamil, Telugu, Malayalam, Kannada, Gujarati, Bengali, Marathi, Punjabi)
-   **Mapping**: Leaflet (OpenStreetMap) for market visualization
-   **PWA**: Installable as a native app; offline-first architecture.

## 🚀 Getting Started

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/ranjan-arnav/finhack_25.git
    cd finhack_25
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_GROQ_API_KEY=your_groq_key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## 📱 Accessibility & Inclusivity

-   **Mobile-First Design**: Optimized for small touchscreens common in rural India.
-   **High Contrast UI**: Readable in bright sunlight (field conditions).
-   **Voice Support**: Critical for users with lower literacy levels.
-   **Region-Specific**: automatically adapts currencies, units, and languages.

---

*Built with ❤️ for FINhack 2025*
 minor documentation update 
