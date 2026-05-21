// lib/speech.ts - Speech-to-Text and Text-to-Speech using Google Cloud + Web Speech API
export class SpeechService {
  private static recognition: any = null
  private static synthesis: SpeechSynthesis | null = null

  // Initialize Web Speech API (works in browser)
  static initWebSpeech() {
    if (typeof window === 'undefined') return

    // Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.recognition.continuous = false
      this.recognition.interimResults = false
    }

    // Speech Synthesis
    this.synthesis = window.speechSynthesis
  }

  // Listen for speech (Web Speech API - works offline)
  static async listenWebSpeech(language: string = 'en-IN'): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      this.recognition.lang = language

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        resolve(transcript)
      }

      this.recognition.onerror = (event: any) => {
        reject(new Error(event.error))
      }

      this.recognition.start()
    })
  }

  // Speak text (Web Speech API - works offline)
  static speakWebSpeech(text: string, language: string = 'en-IN'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language
      utterance.rate = 0.9
      utterance.pitch = 1

      // Try to find an Indian voice
      const voices = this.synthesis.getVoices()
      const indianVoice = voices.find((voice) => voice.lang.startsWith(language.split('-')[0]))
      if (indianVoice) {
        utterance.voice = indianVoice
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(event)

      this.synthesis.speak(utterance)
    })
  }

  // Google Cloud Speech-to-Text (for better accuracy with Indic languages)
  static async transcribeWithGoogle(audioBlob: Blob, language: string = 'en-IN'): Promise<string> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY
      if (!apiKey) {
        throw new Error('Google Cloud API key not configured')
      }

      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob)

      const response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 48000,
              languageCode: language,
              enableAutomaticPunctuation: true,
            },
            audio: {
              content: base64Audio,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Google Speech API request failed')
      }

      const data = await response.json()
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No transcription results')
      }

      return data.results[0].alternatives[0].transcript
    } catch (error) {
      console.error('Google Speech API failed:', error)
      throw error
    }
  }

  // Google Cloud Text-to-Speech
  static async synthesizeWithGoogle(text: string, language: string = 'en-IN'): Promise<Blob> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY
      if (!apiKey) {
        throw new Error('Google Cloud API key not configured')
      }

      // Map language codes to Google voices
      const voiceMap: { [key: string]: { name: string; gender: string } } = {
        'en-IN': { name: 'en-IN-Wavenet-D', gender: 'MALE' },
        'hi-IN': { name: 'hi-IN-Wavenet-D', gender: 'MALE' },
        'ta-IN': { name: 'ta-IN-Wavenet-D', gender: 'MALE' },
        'te-IN': { name: 'te-IN-Standard-A', gender: 'FEMALE' },
        'ml-IN': { name: 'ml-IN-Wavenet-D', gender: 'MALE' },
        'kn-IN': { name: 'kn-IN-Wavenet-D', gender: 'MALE' },
        'gu-IN': { name: 'gu-IN-Wavenet-D', gender: 'MALE' },
        'bn-IN': { name: 'bn-IN-Wavenet-D', gender: 'MALE' },
      }

      const voice = voiceMap[language] || voiceMap['en-IN']

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text },
            voice: {
              languageCode: language,
              name: voice.name,
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 0,
              speakingRate: 0.9,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Google TTS API request failed')
      }

      const data = await response.json()
      const audioContent = data.audioContent

      // Convert base64 to blob
      const audioBlob = this.base64ToBlob(audioContent, 'audio/mp3')
      return audioBlob
    } catch (error) {
      console.error('Google TTS API failed:', error)
      throw error
    }
  }

  // Helper: Convert Blob to Base64
  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Helper: Convert Base64 to Blob
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  // Get available languages
  static readonly SUPPORTED_LANGUAGES = {
    'en-IN': 'English (India)',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'te-IN': 'Telugu',
    'ml-IN': 'Malayalam',
    'kn-IN': 'Kannada',
    'gu-IN': 'Gujarati',
    'bn-IN': 'Bengali',
    'mr-IN': 'Marathi',
    'pa-IN': 'Punjabi',
  }

  // Detect if browser supports speech
  static isSpeechSupported(): boolean {
    if (typeof window === 'undefined') return false

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    return !!(SpeechRecognition && window.speechSynthesis)
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  SpeechService.initWebSpeech()
}
