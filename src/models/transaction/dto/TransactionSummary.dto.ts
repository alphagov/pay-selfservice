interface SummaryDetailData {
  count: number
  gross_amount: number
}

export interface TransactionSummaryData {
  payments: SummaryDetailData,
  moto_payments: SummaryDetailData,
  refunds: SummaryDetailData,
  net_income: number
}
