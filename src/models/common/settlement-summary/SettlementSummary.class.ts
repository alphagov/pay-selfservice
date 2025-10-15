import { SettlementSummaryData } from '@models/common/settlement-summary/dto/SettlementSummary.dto'
import { DateTime } from 'luxon'

class SettlementSummary {
  readonly captureSubmitTime: DateTime | null
  readonly capturedDate: string | null

  constructor(data: SettlementSummaryData) {
    this.captureSubmitTime = data.capture_submit_time ? DateTime.fromISO(data.capture_submit_time) : null
    this.capturedDate = data.captured_date
  }
}

export { SettlementSummary }
