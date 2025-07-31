import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'

export interface PaymentInstrumentData {
  external_id: string
  agreement_external_id: string
  card_details: CardDetailsData,
  type: string
  created_date: string
}
