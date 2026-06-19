import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { SettlementSummaryData } from '@models/common/settlement-summary/dto/SettlementSummary.dto'
import { DateTime } from 'luxon'

export class SettlementSummaryFixture {
  readonly captureSubmitTime?: DateTime | null
  readonly capturedDate?: string | null
  readonly settledDate?: DateTime

  constructor(...options: Partial<SettlementSummaryFixture>[]) {
    this.captureSubmitTime = DateTime.fromISO('2025-07-22T03:14:20.926+01:00', { zone: 'Europe/London' })
    this.capturedDate = '2025-07-22'

    options.forEach((optionObject) => {
      Object.assign(this, optionObject)
    })
  }

  toSettlementSummary(): SettlementSummary {
    return new SettlementSummary(this.toSettlementSummaryData())
  }

  toSettlementSummaryData(): SettlementSummaryData {
    return {
      captured_date: this.capturedDate,
      capture_submit_time: this.captureSubmitTime?.toISO() ?? null,
      settled_date: this.settledDate?.toISODate() ?? undefined,
    }
  }

  static empty(): SettlementSummaryFixture {
    return new SettlementSummaryFixture({
      captureSubmitTime: undefined,
      capturedDate: undefined,
      settledDate: undefined,
    })
  }
}
