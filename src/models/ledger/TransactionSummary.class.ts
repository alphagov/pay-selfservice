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
    this.payments = {
      count: data.payments.count,
      grossAmount: data.payments.gross_amount
    }
    this.motoPayments = {
      count: data.moto_payments.count,
      grossAmount: data.moto_payments.gross_amount
    }
    this.refunds = {
      count: data.refunds.count,
      grossAmount: data.refunds.gross_amount
    }
    this.netIncome = data.net_income
  }
}
