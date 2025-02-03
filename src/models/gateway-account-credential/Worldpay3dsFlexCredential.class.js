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

  // additional metadata returned by Connector - not included in POST body to update credentials
  withExemptionEngineEnabled (exemptionEngineEnabled) {
    this.exemptionEngineEnabled = exemptionEngineEnabled
    return this
  }

  // additional metadata returned by Connector - not included in POST body to update credentials
  withCorporateExemptionsEnabled (corporateExemptionsEnabled) {
    this.corporateExemptionsEnabled = corporateExemptionsEnabled
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
      .withExemptionEngineEnabled(data?.exemption_engine_enabled)
      .withCorporateExemptionsEnabled(data?.corporate_exemptions_enabled)
  }
}

module.exports = Worldpay3dsFlexCredential
