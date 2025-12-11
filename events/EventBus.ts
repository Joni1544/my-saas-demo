/**
 * Event Bus für FuerstFlow
 * Queue-basierte Event-Verarbeitung mit Fehlerbehandlung
 */
import { EventName, EventPayload } from './types/EventTypes'

type EventHandler = (payload: EventPayload) => Promise<void> | void

interface QueuedEvent {
  eventName: EventName
  payload: EventPayload
  timestamp: Date
  retries: number
}

class EventBus {
  private handlers: Map<EventName, Set<EventHandler>> = new Map()
  private queue: QueuedEvent[] = []
  private processing: boolean = false
  private maxRetries: number = 3
  private queueProcessingInterval: number = 1000 // 1 Sekunde

  constructor() {
    // Starte Queue-Verarbeitung
    this.startQueueProcessing()
  }

  /**
   * Abonniere ein Event
   */
  subscribe(eventName: EventName, handler: EventHandler): () => void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set())
    }

    this.handlers.get(eventName)!.add(handler)

    // Rückgabe-Funktion zum Abmelden
    return () => {
      this.handlers.get(eventName)?.delete(handler)
    }
  }

  /**
   * Event emittieren (wird in Queue eingefügt)
   */
  emit(eventName: EventName, payload: EventPayload): void {
    try {
      const queuedEvent: QueuedEvent = {
        eventName,
        payload: {
          ...payload,
          timestamp: payload.timestamp || new Date(),
        },
        timestamp: new Date(),
        retries: 0,
      }

      this.queue.push(queuedEvent)
      
      // Extrahiere ID für Logging
      let payloadId = 'unknown'
      if ('appointmentId' in payload) {
        payloadId = (payload as { appointmentId: string }).appointmentId
      } else if ('customerId' in payload && 'customerName' in payload) {
        payloadId = (payload as { customerId: string }).customerId
      } else if ('taskId' in payload) {
        payloadId = (payload as { taskId: string }).taskId
      } else if ('employeeId' in payload) {
        payloadId = (payload as { employeeId: string }).employeeId
      }
      
      this.log('info', `Event queued: ${eventName}`, { eventName, payloadId })
    } catch (error) {
      this.log('error', `Failed to queue event: ${eventName}`, { error, eventName })
    }
  }

  /**
   * Queue-Verarbeitung starten
   */
  private startQueueProcessing(): void {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0) {
        this.processQueue()
      }
    }, this.queueProcessingInterval)
  }

  /**
   * Queue verarbeiten
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    try {
      const event = this.queue.shift()
      if (!event) {
        this.processing = false
        return
      }

      await this.processEvent(event)
    } catch (error) {
      this.log('error', 'Error processing queue', { error })
    } finally {
      this.processing = false
    }
  }

  /**
   * Einzelnes Event verarbeiten
   */
  private async processEvent(event: QueuedEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName)

    if (!handlers || handlers.size === 0) {
      this.log('debug', `No handlers for event: ${event.eventName}`, { eventName: event.eventName })
      return
    }

    // Führe alle Handler aus
    const handlerPromises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event.payload)
        this.log('debug', `Handler executed successfully for: ${event.eventName}`, { eventName: event.eventName })
      } catch (error) {
        this.log('error', `Handler failed for event: ${event.eventName}`, { error, eventName: event.eventName })
        
        // Retry-Logik
        if (event.retries < this.maxRetries) {
          event.retries++
          this.queue.push(event)
          this.log('info', `Event requeued for retry: ${event.eventName}`, { eventName: event.eventName, retries: event.retries })
        } else {
          this.log('error', `Event failed after max retries: ${event.eventName}`, { eventName: event.eventName })
        }
      }
    })

    await Promise.allSettled(handlerPromises)
  }

  /**
   * Logging-Helper
   */
  private log(level: 'info' | 'error' | 'debug', message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString()
    const logMessage = `[EventBus ${timestamp}] ${message}`
    
    if (level === 'error') {
      console.error(logMessage, meta || '')
    } else if (level === 'debug') {
      // Nur in Development
      if (process.env.NODE_ENV === 'development') {
        console.debug(logMessage, meta || '')
      }
    } else {
      console.log(logMessage, meta || '')
    }
  }

  /**
   * Queue-Status abrufen (für Health-Checks)
   */
  getQueueStatus(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
    }
  }

  /**
   * Queue leeren (für Tests)
   */
  clearQueue(): void {
    this.queue = []
  }
}

// Singleton-Instanz
export const eventBus = new EventBus()

