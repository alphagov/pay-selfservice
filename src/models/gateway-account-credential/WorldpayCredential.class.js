class WorldpayCredential {
  withMerchantCode (merchantCode) {
    this.merchantCode = merchantCode
    return this
  }

  withUsername (username) {
    this.username = username
    return this
  }

  withPassword (password) {
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

  static fromJson (data) {
    return new WorldpayCredential()
      .withMerchantCode(data?.merchant_code)
      .withUsername(data?.username)
      .withPassword(data?.password)
  }
}

module.exports = WorldpayCredential
