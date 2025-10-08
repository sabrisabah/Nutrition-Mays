// WebSocket service for real-time updates
class WebSocketService {
  constructor() {
    this.socket = null
    this.pollingInterval = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000
    this.listeners = new Map()
  }

  connect() {
    try {
      // For now, use polling only to avoid WebSocket errors
      // WebSocket can be enabled when server supports it
      console.log('🔄 Using polling mechanism for real-time updates')
      this.startPolling()
      return
      
      // WebSocket code is disabled for now to avoid connection errors
      // It can be enabled when the server supports WebSocket connections
      
    } catch (error) {
      // Silently handle connection error and fallback to polling
      this.startPolling()
    }
  }

  handleMessage(data) {
    if (data.type === 'meal_plan_updated') {
      // Notify all listeners about meal plan updates
      this.notifyListeners('meal_plan_updated', data)
    }
  }

  addListener(event, callback) {
    try {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, [])
      }
      this.listeners.get(event).push(callback)
    } catch (error) {
      console.error('Error adding listener:', error)
    }
  }

  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket listener:', error)
        }
      })
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      
      setTimeout(() => {
        try {
          this.connect()
        } catch (error) {
          this.startPolling()
        }
      }, this.reconnectInterval)
    } else {
      this.startPolling()
    }
  }

  startPolling() {
    // Fallback polling mechanism
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
    
    console.log('Starting polling mechanism for real-time updates')
    this.pollingInterval = setInterval(() => {
      this.notifyListeners('meal_plan_updated', { type: 'polling_update' })
    }, 5000) // Poll every 5 seconds
  }

  disconnect() {
    try {
      if (this.socket) {
        this.socket.close()
        this.socket = null
      }
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    } catch (error) {
      console.error('Error during disconnect:', error)
    }
  }

  send(data) {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(data))
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService()

export default websocketService
