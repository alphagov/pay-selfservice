export const GatewayAccountType = {
  TEST: 'test',
  LIVE: 'live',
} as const

export type GatewayAccountType = (typeof GatewayAccountType)[keyof typeof GatewayAccountType]
