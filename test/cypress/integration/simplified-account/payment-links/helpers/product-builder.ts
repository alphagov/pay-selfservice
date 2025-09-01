import { ProductData } from '@models/products/dto/Product.dto'

export interface PaymentLinkOptions {
  externalId?: string
  name: string
  href: string
  description?: string
  referenceEnabled?: boolean
  referenceLabel?: string
  referenceHint?: string
  amount?: number
  amountHint?: string
  language?: string
  metadata?: object
}

export const buildPaymentLinkOptions = (opts: PaymentLinkOptions) => {
  return {
    external_id: opts.externalId ?? 'product123abc',
    name: opts.name,
    language: opts.language ?? 'en',
    type: 'ADHOC',
    description: opts.description ?? '',
    price: opts.amount ?? 1337,
    amount_hint: opts.amountHint,
    reference_enabled:  opts.referenceEnabled ?? false,
    reference_label:  opts.referenceLabel,
    reference_hint:  opts.referenceHint,
    _links: [
      {
        rel: 'friendly',
        method: 'GET',
        href: opts.href,
      },
    ],
    ...(opts.metadata && {
      metadata: opts.metadata,
    }),
  } as Partial<ProductData>
}
