import { EventType } from '../types/event-type'
import { ResourceType } from '../types/resource-type'
import { StateData } from './State.dto'

export interface EventsData {
  transaction_id: string
  events: EventData[]
}

export interface EventData {
  amount: number
  resource_type: ResourceType
  event_type: EventType
  timestamp: string
  state: StateData
  data?: Record<string, unknown>
}
