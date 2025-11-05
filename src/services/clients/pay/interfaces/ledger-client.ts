import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'

export interface LedgerTransactionParams {
  accountIds: number[]
  agreementId?: string
  limitTotal?: boolean
  limitTotalSize?: number
  displaySize?: number
  page?: number
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string
  type?: string
  reference?: string
  email?: string
  fromDate?: string
  toDate?: string
  paymentStates?: string[]
  refundStates?: string[]
  disputeStates?: string[]
}

export class LedgerTransactionParamsData {
  readonly account_id: string
  readonly agreement_id?: string
  readonly limit_total: string
  readonly limit_total_size: string
  readonly display_size?: string
  readonly page: string
  readonly cardholder_name?: string
  readonly last_digits_card_number?: string
  readonly metadata_value?: string
  readonly card_brands?: string
  readonly transaction_type?: string
  readonly reference?: string
  readonly email?: string
  readonly from_date?: string
  readonly to_date?: string
  readonly payment_states?: string
  readonly refund_states?: string
  readonly dispute_states?: string

  constructor(params: LedgerTransactionParams) {
    this.account_id = params.accountIds.join(',')
    this.agreement_id = params.agreementId?.toString() ?? undefined
    this.limit_total = params.limitTotal ? params.limitTotal.toString() : 'true'
    this.limit_total_size = params.limitTotalSize?.toString() ?? '5001'
    this.display_size = params.displaySize?.toString() ?? undefined
    this.page = params.page?.toString() ?? '1'
    this.cardholder_name = params.cardholderName?.toString() ?? undefined
    this.last_digits_card_number = params.lastDigitsCardNumber?.toString() ?? undefined
    this.metadata_value = params.metadataValue?.toString() ?? undefined
    this.card_brands = params.brand?.toString() ?? undefined
    this.transaction_type = params.type ?? undefined
    this.reference = params.reference ?? undefined
    this.email = params.email ?? undefined
    this.from_date = params.fromDate ?? last12MonthsStartDate.toISO()!
    this.to_date = params.toDate ?? undefined
    this.payment_states = params.paymentStates?.join(',')
    this.refund_states = params.refundStates?.join(',')
    this.dispute_states = params.disputeStates?.join(',')
  }

  asQueryString(): string {
    const urlParams = new URLSearchParams()

    Object.entries(this).forEach(([key, value]: [string, string]) => {
      if (value !== undefined && value !== null) {
        urlParams.set(key, value)
      }
    })

    return urlParams.toString()
  }
}
