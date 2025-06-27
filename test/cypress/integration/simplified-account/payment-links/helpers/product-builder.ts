export interface PaymentLinkOptions {
  name: string
  href: string
  language?: string
  metadata?: object
}

export const buildPaymentLinkOptions = (opts: PaymentLinkOptions) => {
  return {
    name: opts.name,
    language: opts.language ?? 'en',
    type: 'ADHOC',
    links: [
      {
        rel: 'friendly',
        method: 'GET',
        href: opts.href,
      },
    ],
    ...(opts.metadata && {
      metadata: opts.metadata,
    }),
  }
}
