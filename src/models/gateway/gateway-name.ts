const LEDGER = 'ledger'
const CONNECTOR = 'connector'

// collection of upstream gateways to which HTTP requests are made
// TODO add others as necessary
export const GatewayName: Record<string, GatewayName> = {
  LEDGER,
  CONNECTOR,
}

export type GatewayName = typeof LEDGER | typeof CONNECTOR
