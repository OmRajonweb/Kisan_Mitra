'use client'

import CropRecommendation from '@/components/CropRecommendation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RecommendPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex items-center gap-4 mb-6">
                    <Link href="/dashboard">
                        <button className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all">
                            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                        </button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Crop Recommendation</h1>
                </header>

                <CropRecommendation />
            </div>
        </div>
    )
}
