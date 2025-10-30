import { DateTime } from 'luxon'
import { EventData } from './dto/Event.dto'
import { ResourceType } from './types/resource-type'
import { EventType, EventTypeFriendlyNames } from './types/event-type'
import { Status } from './types/status'
import { State } from './State.class'

class Event {
  readonly amount: number
  readonly resourceType: ResourceType
  readonly eventType: EventType
  readonly timestamp: DateTime
  readonly state: State
  readonly metadata?: Record<string, unknown>
  constructor(data: EventData) {
    this.amount = data.amount
    this.resourceType = data.resource_type
    this.eventType = data.event_type
    this.timestamp = DateTime.fromISO(data.timestamp)
    this.state = new State(data.state)
    this.metadata = data.data
  }

  get friendlyEventType(): string {
    if (this.state.status === Status.ERROR) {
      return 'Error'
    } else {
      return EventTypeFriendlyNames[this.eventType] ?? this.eventType // fall back to ledger type if not present in friendly names
    }
  }

  get isNegativeMovement(): boolean {
    return (
      this.resourceType === ResourceType.REFUND ||
      this.eventType === EventType.DISPUTE_CREATED ||
      this.eventType === EventType.DISPUTE_EVIDENCE_SUBMITTED ||
      this.eventType === EventType.DISPUTE_LOST
    )
  }
}

export { Event }
