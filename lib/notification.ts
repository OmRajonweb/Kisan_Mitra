// lib/notification.ts - Push Notifications Service
export class NotificationService {
  static async requestPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    try {
      const permission = await window.Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  static async sendNotification(title: string, options: NotificationOptions = {}) {
    if (typeof window === 'undefined' || !('Notification' in window) || window.Notification.permission !== 'granted') {
      return false
    }

    try {
      const notification = new window.Notification(title, {
        icon: '/icon.png',
        badge: '/icon.png',
        ...options,
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      return true
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  static async sendWeatherAlert(condition: string, temperature: number) {
    const title = 'Weather Alert'
    const body = `Current conditions: ${condition}\nTemperature: ${temperature}°C`
    return this.sendNotification(title, { body })
  }

  static async sendMarketAlert(crop: string, price: number, trend: 'up' | 'down') {
    const title = 'Market Price Alert'
    const direction = trend === 'up' ? 'increased to' : 'decreased to'
    const body = `${crop} price has ${direction} ₹${price}`
    return this.sendNotification(title, { body })
  }

  static async sendCropAlert(cropName: string, daysLeft: number) {
    if (daysLeft <= 7) {
      const title = 'Crop Alert'
      const body = `Your ${cropName} crop will be ready for harvest in ${daysLeft} days!`
      return this.sendNotification(title, { body })
    }
    return false
  }

  static async sendDiseaseAlert(cropName: string, diseaseName: string) {
    const title = 'Disease Alert'
    const body = `Possible ${diseaseName} detected in your ${cropName}. Check the diagnosis section for details.`
    return this.sendNotification(title, { body })
  }
}