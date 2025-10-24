import { Event } from '@models/transaction/Event.class'
import { Status } from '@models/transaction/types/status'
import { EventType, EventTypeFriendlyNames } from '@models/transaction/types/event-type'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'

export class EventDisplayValues {
  private readonly event: Event
  readonly metadata?: string

  constructor(event: Event) {
    this.event = event

    if (event.eventType === EventType.REFUND_CREATED_BY_USER) {
      this.metadata = `Submitted by: ${event.metadata?.user_email as string}`
    } else if (
      event.state.status === Status.CANCELLED ||
      event.state.status === Status.DECLINED ||
      event.state.status === Status.ERROR
    ) {
      this.metadata = `${event.state.code}: ${event.state.message}`
    }
  }

  get eventType(): string {
    if (this.event.state.status === Status.ERROR) {
      return 'Error'
    } else {
      return EventTypeFriendlyNames[this.event.eventType] ?? this.event.eventType // fall back to ledger type if not present in friendly names
    }
  }

  get amount(): string {
    return `${this.event.isNegativeMovement ? '–' : ''}${penceToPoundsWithCurrency(this.event.amount)}`
  }

  get timestamp(): string {
    return this.event.timestamp.toFormat('dd LLL yyyy HH:mm:ss')
  }
}
