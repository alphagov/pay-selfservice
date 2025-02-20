class ChargeRequest {
  /**
   * @param {number} amount
   */
  withAmount (amount) {
    this.amount = amount
    return this
  }

  /**
   * @param {string} description
   */
  withDescription (description) {
    this.description = description
    return this
  }

  /**
   * @param {string} reference
   */
  withReference (reference) {
    this.reference = reference
    return this
  }

  /**
   * @param {string} returnUrl
   */
  withReturnUrl (returnUrl) {
    this.returnUrl = returnUrl
    return this
  }

  /**
   * @param {string} credentialExternalId
   */
  withCredentialExternalId (credentialExternalId) {
    this.credentialExternalId = credentialExternalId
    return this
  }

  /**
   * @param {boolean} moto
   */
  withMoto (moto) {
    this.moto = moto
    return this
  }

  /**
   * @returns {Object}
   */
  toPayload () {
    return {
      amount: this.amount,
      description: this.description,
      reference: this.reference,
      return_url: this.returnUrl,
      credential_id: this.credentialExternalId,
      moto: this.moto
    }
  }
}

module.exports = ChargeRequest
