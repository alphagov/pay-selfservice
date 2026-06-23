import { Status } from '@models/transaction/types/status'
import { State } from '@models/transaction/State.class'
import { StateData } from '@models/transaction/dto/State.dto'

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

  static Created() {
    return new TransactionStateFixture({
      status: Status.CREATED,
      finished: false,
    })
  }

  static Submitted() {
    return new TransactionStateFixture({
      status: Status.SUBMITTED,
      finished: false,
    })
  }

  static Cancelled() {
    return new TransactionStateFixture({
      status: Status.CANCELLED,
      finished: true,
    })
  }

  static Timedout() {
    return new TransactionStateFixture({
      status: Status.TIMEDOUT,
      finished: true,
    })
  }

  static Success() {
    return new TransactionStateFixture({
      status: Status.SUCCESS,
      finished: true,
    })
  }

  static RefundSuccess() {
    return new TransactionStateFixture({
      status: Status.SUCCESS,
      finished: true,
    })
  }

  static DisputeWon() {
    return new TransactionStateFixture({
      status: Status.WON,
      finished: true,
    })
  }
}
