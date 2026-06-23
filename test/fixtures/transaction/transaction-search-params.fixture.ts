import type { DateTime } from 'luxon'
import { TransactionSearchParamsData } from '@models/transaction/dto/TransactionSearchParams.dto'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import { toLower } from 'lodash'

export class TransactionSearchParamsFixture {
  gatewayAccountIds: number[] | string[]
  agreementId?: string
  displaySize?: number
  page?: number
  limitTotal?: boolean
  limitTotalSize?: number
  cardholderName?: string
  lastDigitsCardNumber?: string
  metadataValue?: string
  brand?: string[]
  reference?: string
  email?: string
  type?: string
  fromDate?: DateTime<true>
  toDate?: DateTime<true>
  paymentStates?: string[]
  refundStates?: string[]
  disputeStates?: string[]
  gatewayPayoutId?: string
  motoHeader?: boolean
  feeHeaders?: boolean
  withPagination: boolean

  constructor(...overrides: Partial<TransactionSearchParamsFixture>[]) {
    this.gatewayAccountIds = [100]
    this.displaySize = 20
    this.page = 1
    this.limitTotal = true
    this.limitTotalSize = 5001
    this.withPagination = true

    overrides.forEach((override) => Object.assign(this, override))
  }

  toSearchParams() {
    const searchParams = new TransactionSearchParams(this.gatewayAccountIds, this.withPagination)

    Object.assign(searchParams, this)
    return searchParams
  }

  toSearchParamsData() {
    return new TransactionSearchParamsData(
      this.gatewayAccountIds.join(','),
      this.limitTotal === true ? 'true' : 'false',
      this.limitTotalSize?.toString() ?? '5001',
      {
        agreement_id: this.agreementId?.toString() ?? undefined,
        display_size: this.displaySize?.toString() ?? undefined,
        page: this.page?.toString(),
        cardholder_name: this.cardholderName?.toString().replace(' ', '+') ?? undefined,
        last_digits_card_number: this.lastDigitsCardNumber?.toString() ?? undefined,
        metadata_value: this.metadataValue?.toString().replace(' ', '+') ?? undefined,
        card_brands: this.brand?.join(',') ?? undefined,
        transaction_type: this.type ?? undefined,
        reference: this.reference?.replace(' ', '+') ?? undefined,
        email: this.email ?? undefined,
        from_date: this.fromDate?.isValid ? this.fromDate.toUTC().toISO() : undefined,
        to_date: this.toDate?.isValid ? this.toDate.toUTC().toISO() : undefined,
        payment_states: this.paymentStates?.map(toLower).join(','),
        refund_states: this.refundStates?.map(toLower).join(','),
        dispute_states: this.disputeStates?.map(toLower).join(','),
        gateway_payout_id: this.gatewayPayoutId,
      }
    )
  }
}
