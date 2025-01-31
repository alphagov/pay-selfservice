class Worldpay3dsFlexCredential {
  withOrganisationalUnitId (organisationalUnitId) {
    this.organisationalUnitId = organisationalUnitId
    return this
  }

  withIssuer (issuer) {
    this.issuer = issuer
    return this
  }

  withJwtMacKey (jwtMacKey) {
    this.jwtMacKey = jwtMacKey
    return this
  }

  toJson () {
    return {
      organisational_unit_id: this.organisationalUnitId,
      issuer: this.issuer,
      jwt_mac_key: this.jwtMacKey
    }
  }

  static fromJson (data) {
    return new Worldpay3dsFlexCredential()
      .withOrganisationalUnitId(data?.organisational_unit_id)
      .withIssuer(data?.issuer)
      .withJwtMacKey(data?.jwt_mac_key)
  }
}

module.exports = Worldpay3dsFlexCredential
