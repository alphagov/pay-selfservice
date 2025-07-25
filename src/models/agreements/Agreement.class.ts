import { PaymentInstrument } from '@models/agreements/PaymentInstrument.class'
import { AgreementData } from '@models/agreements/dto/Agreement.dto'
import { DateTime } from 'luxon'

class Agreement {
  readonly externalId: string
  readonly serviceExternalId: string
  readonly reference: string
  readonly description: string
  readonly status: string
  readonly live: boolean
  readonly createdDate: DateTime
  readonly paymentInstrument?: PaymentInstrument
  readonly userIdentifier: string
  readonly cancelledDate?: DateTime
  readonly cancelledByUserEmail?: string

  constructor(data: AgreementData) {
    this.externalId = data.external_id
    this.serviceExternalId = data.service_id
    this.reference = data.reference
    this.description = data.description
    this.status = data.status
    this.live = data.live
    this.createdDate = DateTime.fromISO(data.created_date)
    this.paymentInstrument = data.payment_instrument ? new PaymentInstrument(data.payment_instrument) : undefined
    this.userIdentifier = data.user_identifier
    this.cancelledDate = data.cancelled_date ? DateTime.fromISO(data.cancelled_date) : undefined
    this.cancelledByUserEmail = data.cancelled_by_user_email
  }
}

export { Agreement }
