// lib/weather.ts - Real Weather service with OpenWeatherMap API
export interface WeatherData {
  current: {
    temp: number
    condition: string
    humidity: number
    wind: number
    rainfall: number
    feelsLike: number
    uvIndex: number
    pressure: number
    visibility: number
  }
  forecast: Array<{
    day: string
    temp: number
    tempMin: number
    tempMax: number
    condition: string
    icon: string
    precipitation: number
    dt: number
  }>
  location: {
    city: string
    country: string
    lat?: number
    lon?: number
  }
  lastUpdated: Date
}

export class WeatherService {
  private static readonly API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5'

  // Get coordinates for Indian location
  private static async getCoordinates(location: string): Promise<{ lat: number; lon: number }> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/weather?q=${encodeURIComponent(location)},IN&appid=${this.API_KEY}&units=metric`
      )

      if (!response.ok) {
        throw new Error('Location not found')
      }

      const data = await response.json()
      return {
        lat: data.coord.lat,
        lon: data.coord.lon,
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
      // Default to Delhi if location not found
      return { lat: 28.6139, lon: 77.209 }
    }
  }

  static async fetchWeather(location: string): Promise<WeatherData> {
    try {
      if (!this.API_KEY) {
        console.warn('OpenWeather API key not found, using demo data')
        return this.getDemoData(location)
      }

      const { lat, lon } = await this.getCoordinates(location)
      return this.fetchWeatherByCoordinates(lat, lon, location)
    } catch (error) {
      console.error('Failed to fetch weather:', error)
      return this.getDemoData(location)
    }
  }

  static async fetchWeatherByCoordinates(lat: number, lon: number, fallbackLocation = 'Your Location'): Promise<WeatherData> {
    try {
      if (!this.API_KEY) {
        console.warn('OpenWeather API key not found, using demo data')
        return this.getDemoData(fallbackLocation)
      }

      const [currentResponse, forecastResponse, uvResponse] = await Promise.all([
        fetch(`${this.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`),
        fetch(`${this.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${this.API_KEY}&units=metric`),
        fetch(`${this.BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${this.API_KEY}`),
      ])

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Weather API request failed')
      }

      const currentData = await currentResponse.json()
      const forecastData = await forecastResponse.json()
      const uvData = uvResponse.ok ? await uvResponse.json() : { value: 0 }

      const current = {
        temp: Math.round(currentData.main.temp),
        condition: this.mapCondition(currentData.weather[0].main),
        humidity: currentData.main.humidity,
        wind: Math.round(currentData.wind.speed * 3.6),
        rainfall: currentData.rain?.['1h'] || 0,
        feelsLike: Math.round(currentData.main.feels_like),
        uvIndex: Math.round(uvData.value || 0),
        pressure: currentData.main.pressure,
        visibility: Math.round(currentData.visibility / 1000),
      }

      const dailyForecasts = this.processForecast(forecastData.list)

      return {
        current,
        forecast: dailyForecasts,
        location: {
          city: currentData.name || fallbackLocation,
          country: currentData.sys.country,
          lat,
          lon,
        },
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error('Failed to fetch weather by coordinates:', error)
      return this.getDemoData(fallbackLocation)
    }
  }

  private static processForecast(forecastList: any[]): WeatherData['forecast'] {
    const dailyData: { [key: string]: any[] } = {}

    // Group by day
    forecastList.forEach((item) => {
      const date = new Date(item.dt * 1000)
      const dayKey = date.toDateString()

      if (!dailyData[dayKey]) {
        dailyData[dayKey] = []
      }
      dailyData[dayKey].push(item)
    })

    // Take first 5 days and get midday data
    const days = Object.keys(dailyData).slice(0, 5)

    return days.map((dayKey, index) => {
      const dayItems = dailyData[dayKey]
      // Find item closest to noon (12:00)
      const noonItem = dayItems.reduce((prev, curr) => {
        const prevHour = new Date(prev.dt * 1000).getHours()
        const currHour = new Date(curr.dt * 1000).getHours()
        return Math.abs(currHour - 12) < Math.abs(prevHour - 12) ? curr : prev
      })

      const date = new Date(noonItem.dt * 1000)
      const dayName = index === 0 ? 'Today' :
        index === 1 ? 'Tomorrow' :
          date.toLocaleDateString('en-US', { weekday: 'short' })

      // Calculate min/max from all items of the day
      const temps = dayItems.map((item) => item.main.temp)
      const tempMin = Math.round(Math.min(...temps))
      const tempMax = Math.round(Math.max(...temps))

      return {
        day: dayName,
        temp: Math.round(noonItem.main.temp),
        tempMin,
        tempMax,
        condition: this.mapCondition(noonItem.weather[0].main),
        icon: this.mapIcon(noonItem.weather[0].main),
        precipitation: Math.round((noonItem.pop || 0) * 100), // Probability of precipitation
        dt: noonItem.dt,
      }
    })
  }

  private static mapCondition(condition: string): string {
    const conditionMap: { [key: string]: string } = {
      Clear: 'Sunny',
      Clouds: 'Cloudy',
      Rain: 'Rainy',
      Drizzle: 'Rainy',
      Thunderstorm: 'Stormy',
      Snow: 'Snowy',
      Mist: 'Misty',
      Fog: 'Foggy',
      Haze: 'Hazy',
    }
    return conditionMap[condition] || 'Partly Cloudy'
  }

  private static mapIcon(condition: string): string {
    const iconMap: { [key: string]: string } = {
      Clear: 'sun',
      Clouds: 'cloud',
      Rain: 'rain',
      Drizzle: 'rain',
      Thunderstorm: 'storm',
      Snow: 'snow',
    }
    return iconMap[condition] || 'cloud-sun'
  }

  private static getDemoData(location: string): WeatherData {
    return {
      current: {
        temp: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        wind: 12,
        rainfall: 0,
        feelsLike: 30,
        uvIndex: 7,
        pressure: 1013,
        visibility: 10,
      },
      forecast: [
        {
          day: 'Today',
          temp: 28,
          tempMin: 22,
          tempMax: 32,
          condition: 'Sunny',
          icon: 'sun',
          precipitation: 0,
          dt: Math.floor(Date.now() / 1000),
        },
        {
          day: 'Tomorrow',
          temp: 26,
          tempMin: 21,
          tempMax: 29,
          condition: 'Rainy',
          icon: 'rain',
          precipitation: 80,
          dt: Math.floor(Date.now() / 1000) + 86400,
        },
        {
          day: 'Wed',
          temp: 27,
          tempMin: 22,
          tempMax: 30,
          condition: 'Cloudy',
          icon: 'cloud',
          precipitation: 20,
          dt: Math.floor(Date.now() / 1000) + 172800,
        },
        {
          day: 'Thu',
          temp: 29,
          tempMin: 23,
          tempMax: 33,
          condition: 'Sunny',
          icon: 'sun',
          precipitation: 0,
          dt: Math.floor(Date.now() / 1000) + 259200,
        },
        {
          day: 'Fri',
          temp: 27,
          tempMin: 22,
          tempMax: 31,
          condition: 'Partly Cloudy',
          icon: 'cloud-sun',
          precipitation: 10,
          dt: Math.floor(Date.now() / 1000) + 345600,
        },
      ],
      location: {
        city: location,
        country: 'India',
      },
      lastUpdated: new Date(),
    }
  }

  static getWeatherIcon(condition: string) {
    const icons: Record<string, string> = {
      sun: '☀️',
      rain: '🌧️',
      cloud: '☁️',
      'cloud-sun': '⛅',
      storm: '⛈️',
      snow: '❄️',
    }
    return icons[condition] || '🌤️'
  }

  static getWeatherAdvice(weather: WeatherData): string[] {
    const advice: string[] = []

    if (weather.current.temp > 35) {
      advice.push('weather.advice.hot')
    }

    if (weather.current.humidity > 80) {
      advice.push('weather.advice.humidity')
    }

    if (weather.current.wind > 20) {
      advice.push('weather.advice.wind')
    }

    const hasRainForecast = weather.forecast.some((day) => day.precipitation > 50)
    if (hasRainForecast) {
      advice.push('weather.advice.rain')
    }

    if (weather.current.uvIndex > 8) {
      advice.push('weather.advice.uv')
    }

    if (advice.length === 0) {
      advice.push('weather.advice.good')
    }

    return advice
  }
}
