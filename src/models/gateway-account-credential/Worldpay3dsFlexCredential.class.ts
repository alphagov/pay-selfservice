import { Worldpay3dsFlexCredentialData } from '@models/gateway-account-credential/dto/Worldpay3dsFlexCredential.dto'

class Worldpay3dsFlexCredential {
  public organisationalUnitId: string | undefined
  public issuer: string | undefined
  public jwtMacKey: string | undefined
  public exemptionEngineEnabled: boolean | undefined
  public corporateExemptionsEnabled: boolean | undefined

  withOrganisationalUnitId (organisationalUnitId: string) {
    this.organisationalUnitId = organisationalUnitId
    return this
  }

  withIssuer (issuer: string) {
    this.issuer = issuer
    return this
  }

  // not returned by Connector
  withJwtMacKey (jwtMacKey: string) {
    this.jwtMacKey = jwtMacKey
    return this
  }

  // additional metadata returned by Connector - not included in POST body to update credentials
  withExemptionEngineEnabled (exemptionEngineEnabled: boolean) {
    this.exemptionEngineEnabled = exemptionEngineEnabled
    return this
  }

  // additional metadata returned by Connector - not included in POST body to update credentials
  withCorporateExemptionsEnabled (corporateExemptionsEnabled: boolean) {
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

  static fromJson (data: Worldpay3dsFlexCredentialData) {
    return new Worldpay3dsFlexCredential()
      .withOrganisationalUnitId(data?.organisational_unit_id)
      .withIssuer(data?.issuer)
      .withExemptionEngineEnabled(data?.exemption_engine_enabled ?? false)
      .withCorporateExemptionsEnabled(data?.corporate_exemptions_enabled ?? false)
  }
}

export = Worldpay3dsFlexCredential
