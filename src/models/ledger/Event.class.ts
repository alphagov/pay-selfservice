import { DateTime } from 'luxon'
import { EventData, EventStateData } from './dto/Event.dto'
import { ResourceType } from './types/resource-type'
import { EventType, EventTypeFriendlyNames } from './types/event-type'

class Event {
  readonly amount: number
  readonly resourceType: ResourceType
  readonly eventType: EventType
  readonly timestamp: DateTime
  readonly state: EventState
  readonly metadata?: Record<string, unknown>
  constructor(data: EventData) {
    this.amount = data.amount
    this.resourceType = data.resource_type
    this.eventType = data.event_type
    this.timestamp = DateTime.fromISO(data.timestamp)
    this.state = new EventState(data.state)
    this.metadata = data.data
  }

  get friendlyEventType(): string {
    return EventTypeFriendlyNames[this.eventType] ?? this.eventType // fall back to ledger type if not present in friendly names
  }
}

class EventState {
  readonly status: string
  readonly finished: boolean
  readonly code?: string
  readonly message?: string
  readonly canRetry?: boolean
  constructor(data: EventStateData) {
    this.status = data.status
    this.finished = data.finished
    this.code = data.code
    this.message = data.message
    this.canRetry = data.can_retry
  }
}

export { Event }
