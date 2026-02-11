import { ResourceType } from '@models/transaction/types/resource-type'
import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'

export interface PaymentDetailsData {
  readonly description: string
  readonly email: string
  readonly reference: string
  readonly transaction_type: ResourceType
  readonly card_details: CardDetailsData
}
