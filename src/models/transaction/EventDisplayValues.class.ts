import { Event } from '@models/transaction/Event.class'
import { Status } from '@models/transaction/types/status'
import { EventType, EventTypeFriendlyNames } from '@models/transaction/types/event-type'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { DATE_TIME } from '@models/constants/time-formats'

export class EventDisplayValues {
  private readonly event: Event

  constructor(event: Event) {
    this.event = event
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
    const offset = this.event.timestamp.setZone('Europe/London').isInDST ? ' (BST)' : ' (GMT)'
    return this.event.timestamp.toFormat(DATE_TIME) + offset
  }

  get metadata(): string | undefined {
    if (this.event.eventType === EventType.REFUND_CREATED_BY_USER) {
      return `Submitted by: ${this.event.metadata?.user_email as string}`
    } else if (
      this.event.state.status === Status.CANCELLED ||
      this.event.state.status === Status.DECLINED ||
      this.event.state.status === Status.ERROR
    ) {
      return `${this.event.state.code}: ${this.event.state.message}`
    }
  }
}
