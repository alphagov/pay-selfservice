import { PaymentInstrumentData } from '@models/agreements/dto/PaymentInstrument.dto'

export interface AgreementData {
  external_id: string
  service_id: string
  reference: string
  description: string
  status: string
  live: boolean
  created_date: string
  payment_instrument?: PaymentInstrumentData
  user_identifier: string
  cancelled_date?: string
  cancelled_by_user_email?: string
}
