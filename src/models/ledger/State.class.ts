import { StateData } from './dto/State.dto'
import { parseStatus, Status } from './types/status'

export class State {
  readonly status: Status
  readonly finished: boolean
  readonly code?: string
  readonly message?: string
  readonly canRetry?: boolean
  constructor(data: StateData) {
    this.status = parseStatus(data.status)
    this.finished = data.finished
    this.code = data.code
    this.message = data.message
    this.canRetry = data.can_retry
  }
}
