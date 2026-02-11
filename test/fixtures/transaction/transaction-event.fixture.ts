import { ResourceType } from '@models/transaction/types/resource-type'
import { EventType, EventTypeFriendlyNames } from '@models/transaction/types/event-type'
import { DateTime } from 'luxon'
import { State } from '@models/transaction/State.class'
import { EventData } from '@models/transaction/dto/Event.dto'
import { Status } from '@models/transaction/types/status'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { Event } from '@models/transaction/Event.class'

export class TransactionEventFixture {
  readonly amount: number
  readonly resourceType: ResourceType
  readonly eventType: EventType
  readonly timestamp: DateTime
  readonly state: State
  readonly metadata?: Record<string, unknown>

  constructor(options?: Partial<TransactionEventFixture>) {
    this.amount = 1000
    this.resourceType = ResourceType.PAYMENT
    this.eventType = EventType.PAYMENT_CREATED
    this.timestamp = DateTime.fromISO('2025-07-22T03:14:15.926Z')
    this.state = new TransactionStateFixture()

    if (options) {
      Object.assign(this, options)
    }
  }

  toEvent() {
    return new Event(this.toEventData())
  }

  toEventData(): EventData {
    return {
      amount: this.amount,
      resource_type: this.resourceType,
      event_type: this.eventType,
      timestamp: this.timestamp.toISO()!,
      state: this.state,
      data: this.metadata,
    }
  }
}
