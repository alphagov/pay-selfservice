import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { toLower } from 'lodash'
import { TimeConstants } from '@utils/time/time-constants'

export class TransactionSearchParamsData {
  readonly account_id: string
  readonly agreement_id?: string
  readonly limit_total: string
  readonly limit_total_size: string
  readonly display_size?: string
  readonly page?: string
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
  readonly gateway_payout_id?: string

  constructor(
    gatewayAccountId: string,
    limitTotal: string,
    limitTotalSize: string,
    optionalParams?: Partial<TransactionSearchParamsData>
  ) {
    this.account_id = gatewayAccountId
    this.limit_total = limitTotal
    this.limit_total_size = limitTotalSize

    Object.assign(this, optionalParams)
  }

  static fromSearchParams(searchParams: TransactionSearchParams) {
    const additionalParams = {
      agreement_id: searchParams.agreementId?.toString() ?? undefined,
      display_size: searchParams.displaySize?.toString() ?? undefined,
      page: searchParams.page?.toString(),
      cardholder_name: searchParams.cardholderName?.toString() ?? undefined,
      last_digits_card_number: searchParams.lastDigitsCardNumber?.toString() ?? undefined,
      metadata_value: searchParams.metadataValue?.toString() ?? undefined,
      card_brands: searchParams.brand?.join(',') ?? undefined,
      transaction_type: searchParams.type ?? undefined,
      reference: searchParams.reference ?? undefined,
      email: searchParams.email ?? undefined,
      from_date: getFromDate(searchParams) ?? undefined,
      to_date: searchParams.toDate?.isValid ? searchParams.toDate.toUTC().toISO() : undefined,
      payment_states: searchParams.paymentStates?.map(toLower).join(','),
      refund_states: searchParams.refundStates?.map(toLower).join(','),
      dispute_states: searchParams.disputeStates?.map(toLower).join(','),
      gateway_payout_id: searchParams.gatewayPayoutId,
    }

    return new TransactionSearchParamsData(
      searchParams.accountIds.join(','),
      searchParams.limitTotal === false ? 'false' : 'true',
      searchParams.limitTotalSize?.toString() ?? '5001',
      additionalParams
    )
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

function getFromDate(params: TransactionSearchParams): string | undefined {
  if (params.dateFilter === 'all-time') {
    return undefined
  } else if (params.fromDate?.isValid) {
    return params.fromDate.toUTC().toISO()
  } else {
    return TimeConstants.TWELVE_MONTHS_AGO.toUTC().toISO()
  }
}
