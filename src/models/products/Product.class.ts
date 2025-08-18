import { ProductData } from '@models/products/dto/Product.dto'
import { DateTime } from 'luxon'

type Links = Record<
  string,
  {
    method: string
    href: string
  }
>

class Product {
  readonly externalId: string
  readonly gatewayAccountId: number
  readonly dateCreated: DateTime
  readonly name: string
  readonly price: number
  readonly status: string
  readonly apiToken: string
  readonly description?: string
  readonly type: string
  readonly returnUrl: string
  readonly newPaymentLinkJourneyEnabled: boolean
  readonly referenceEnabled: boolean
  readonly referenceLabel?: string
  readonly referenceHint?: string
  readonly amountHint?: string
  readonly language: string
  readonly metadata?: Record<string, string>
  readonly links: Links

  constructor(data: ProductData) {
    this.externalId = data.external_id
    this.gatewayAccountId = data.gateway_account_id
    this.dateCreated = DateTime.fromISO(data.date_created)
    this.name = data.name
    this.price = data.price ?? 0
    this.status = data.status
    this.apiToken = data.pay_api_token
    this.description = data.description?.trim() || undefined
    this.type = data.type
    this.returnUrl = data.return_url
    this.referenceEnabled = data.reference_enabled
    this.referenceLabel = data.reference_label
    this.referenceHint = data.reference_hint
    this.amountHint = data.amount_hint
    this.language = data.language
    this.metadata = data.metadata
    this.newPaymentLinkJourneyEnabled = data.new_payment_link_journey_enabled
    this.links = data._links.reduce<Links>((acc, link) => {
      acc[link.rel] = { method: link.method, href: link.href }
      return acc
    }, {})
  }
}

export = Product
