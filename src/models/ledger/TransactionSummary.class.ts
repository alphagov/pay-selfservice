import { TransactionSummaryData } from '@models/ledger/dto/TransactionSummary.dto'

interface SummaryDetail {
  count: number
  grossAmount: number
}

export class TransactionSummary {
  readonly payments: SummaryDetail
  readonly motoPayments: SummaryDetail
  readonly refunds: SummaryDetail
  readonly netIncome: number

  constructor(data: TransactionSummaryData) {
    this.payments = this.createSummaryDetail(data.payments)
    this.motoPayments = this.createSummaryDetail(data.moto_payments)
    this.refunds = this.createSummaryDetail(data.refunds)
    this.netIncome = data?.net_income ?? 0
  }

  private createSummaryDetail(detail?: { count?: number, gross_amount?: number }) {
    return {
      count: detail?.count ?? 0,
      grossAmount: detail?.gross_amount ?? 0,
    }
  }
}
