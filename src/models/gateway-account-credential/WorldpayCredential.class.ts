import { WorldpayCredentialData } from '@models/gateway-account-credential/dto/WorldpayCredential.dto'

class WorldpayCredential {
  public merchantCode: string | undefined
  public username: string | undefined
  public password: string | undefined

  withMerchantCode (merchantCode: string) {
    this.merchantCode = merchantCode
    return this
  }

  withUsername (username: string) {
    this.username = username
    return this
  }

  withPassword (password: string) {
    this.password = password
    return this
  }

  toJson () {
    return {
      ...this.merchantCode && { merchant_code: this.merchantCode },
      ...this.username && { username: this.username },
      ...this.password && { password: this.password }
    }
  }

  static fromJson (data: WorldpayCredentialData) {
    return new WorldpayCredential()
      .withMerchantCode(data?.merchant_code)
      .withUsername(data?.username)
      .withPassword(data?.password)
  }
}

export = WorldpayCredential
