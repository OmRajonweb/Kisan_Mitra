import React from 'react'

interface SimpleMarkdownProps {
    content: string
    className?: string
}

export default function SimpleMarkdown({ content, className = '' }: SimpleMarkdownProps) {
    // Split content by newlines
    const lines = content.split('\n')

    return (
        <div className={`space-y-3 ${className}`}>
            {lines.map((line, index) => {
                const key = index

                // H1
                if (line.startsWith('# ')) {
                    return <h1 key={key} className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-4">{line.replace('# ', '')}</h1>
                }

                // H2
                if (line.startsWith('## ')) {
                    return <h2 key={key} className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-5 mb-3">{line.replace('## ', '')}</h2>
                }

                // H3
                if (line.startsWith('### ')) {
                    return <h3 key={key} className="text-xl font-semibold text-gray-800 dark:text-gray-300 mt-4 mb-2">{line.replace('### ', '')}</h3>
                }

                // Bullet points
                if (line.startsWith('- ')) {
                    return (
                        <div key={key} className="flex gap-2 ml-4">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span className="text-gray-700 dark:text-gray-300">
                                {parseBold(line.replace('- ', ''))}
                            </span>
                        </div>
                    )
                }

                // Numbered lists (basic support for "1. ")
                if (/^\d+\.\s/.test(line)) {
                    return (
                        <div key={key} className="flex gap-2 ml-4">
                            <span className="text-indigo-500 font-bold">{line.match(/^\d+\./)?.[0]}</span>
                            <span className="text-gray-700 dark:text-gray-300">
                                {parseBold(line.replace(/^\d+\.\s/, ''))}
                            </span>
                        </div>
                    )
                }

                // Empty lines
                if (line.trim() === '') {
                    return <div key={key} className="h-2" />
                }

                // Standard paragraph
                return (
                    <p key={key} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {parseBold(line)}
                    </p>
                )
            })}
        </div>
    )
}

// Helper to parse **bold** text
function parseBold(text: string) {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>
        }
        return part
    })
}
