import { CardTypeData } from '@models/card-type/dto/CardType.dto'

export class CardType {
  readonly brand: string
  readonly id: string
  readonly label: string
  readonly requires3ds: boolean
  readonly type: string

  constructor(cardTypeData: CardTypeData) {
    this.brand = cardTypeData.brand
    this.id = cardTypeData.id
    this.label = cardTypeData.label
    this.requires3ds = cardTypeData.requires3ds
    this.type = cardTypeData.type
  }
}
