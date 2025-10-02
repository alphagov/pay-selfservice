import { EventType } from '../types/event-type'
import { ResourceType } from '../types/resource-type'

export interface EventsData {
  transaction_id: string
  events: EventData[]
}

export interface EventData {
  amount: number
  resource_type: ResourceType
  event_type: EventType
  timestamp: string
  state: EventStateData
  data?: Record<string, unknown>
}

export interface EventStateData {
  status: string
  finished: boolean
  code?: string
  message?: string
  can_retry?: boolean
}
