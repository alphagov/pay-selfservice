import { PaymentInstrumentData } from '@models/agreements/dto/PaymentInstrument.dto'
import { DateTime } from 'luxon'
import { CardDetails } from '@models/common/card-details/CardDetails.class'

class PaymentInstrument {
  readonly externalId: string
  readonly agreementExternalId: string
  readonly cardDetails: CardDetails
  readonly type: string
  readonly createdDate: DateTime

  constructor(data: PaymentInstrumentData) {
    this.externalId = data.external_id
    this.agreementExternalId = data.agreement_external_id
    this.cardDetails = new CardDetails(data.card_details)
    this.type = data.type
    this.createdDate = DateTime.fromISO(data.created_date)
  }
}

export {
  PaymentInstrument
}
