import { Status } from '@models/ledger/types/status'
import { State } from '@models/ledger/State.class'
import { StateData } from '@models/ledger/dto/State.dto'

export class TransactionStateFixture {
  readonly status: Status
  readonly finished: boolean
  readonly code?: string
  readonly message?: string
  readonly canRetry?: boolean
  constructor(options?: Partial<TransactionStateFixture>) {
    this.status = Status.SUCCESS
    this.finished = true

    if (options) {
      Object.assign(this, options)
    }
  }

  toState(): State {
    return new State(this.toStateData())
  }

  toStateData(): StateData {
    return {
      status: this.status,
      finished: this.finished,
      code: this.code,
      message: this.message,
      can_retry: this.canRetry,
    }
  }
}
