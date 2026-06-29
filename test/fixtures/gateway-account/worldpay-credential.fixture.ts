import { WorldpayCredentialData } from '@models/gateway-account-credential/dto/WorldpayCredential.dto'
import WorldpayCredential from '@models/gateway-account-credential/WorldpayCredential.class'

export class WorldpayCredentialFixture {
  readonly merchantCode: string
  readonly username: string
  readonly password: string

  constructor(...overrides: Partial<WorldpayCredentialFixture>[]) {
    this.merchantCode = 'WORLDPAYMERCHANTCODE'
    this.username = 'worldpay-user'
    this.password = 'worldpay-password' // pragma: allowlist secret

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static forMoto(...overrides: Partial<WorldpayCredentialFixture>[]) {
    return new WorldpayCredentialFixture(
      {
        merchantCode: 'WORLDPAYMERCHANTCODEMOTO',
      },
      ...overrides
    )
  }

  toWorldpayCredentialData(): WorldpayCredentialData {
    return {
      merchant_code: this.merchantCode,
      username: this.username,
      password: this.password,
    }
  }

  toWorldpayCredential(): WorldpayCredential {
    return WorldpayCredential.fromJson(this.toWorldpayCredentialData())
  }
}
