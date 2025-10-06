import { UpdateAcceptedCardTypesRequestData } from '@models/card-type/dto/UpdateAcceptedCardTypesRequest.dto'

export class UpdateAcceptedCardTypesRequest {
  private cardTypes!: string[]

  withCardTypes(cardTypes: string[]) {
    this.cardTypes = cardTypes
    return this
  }

  toJson(): UpdateAcceptedCardTypesRequestData {
    return {
      card_types: this.cardTypes,
    }
  }
}
