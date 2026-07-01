import Worldpay3dsFlexCredential from '@models/gateway-account-credential/Worldpay3dsFlexCredential.class'
import { Worldpay3dsFlexCredentialData } from '@models/gateway-account-credential/dto/Worldpay3dsFlexCredential.dto'

export class Worldpay3dsFlexCredentialFixture {
  public organisationalUnitId: string
  public issuer: string
  public jwtMacKey?: string
  public exemptionEngineEnabled: boolean
  public corporateExemptionsEnabled: boolean

  constructor(...overrides: Partial<Worldpay3dsFlexCredentialFixture>[]) {
    this.organisationalUnitId = '5bd9b55e4444761ac0af1c80' // pragma: allowlist secret
    this.issuer = '5bd9e0e4444dce153428c940' // pragma: allowlist secret
    this.exemptionEngineEnabled = false
    this.corporateExemptionsEnabled = false

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  toWorldpay3dsFlexCredentialData(): Worldpay3dsFlexCredentialData {
    return {
      organisational_unit_id: this.organisationalUnitId,
      issuer: this.issuer,
      exemption_engine_enabled: this.exemptionEngineEnabled,
      corporate_exemptions_enabled: this.corporateExemptionsEnabled,
    }
  }

  toWorldpay3dsFlexCredential(): Worldpay3dsFlexCredential {
    return Worldpay3dsFlexCredential.fromJson(this.toWorldpay3dsFlexCredentialData())
  }

  toWorldpay3dsFlexCredentialWithJWT(): Worldpay3dsFlexCredential {
    return Worldpay3dsFlexCredential.fromJson(this.toWorldpay3dsFlexCredentialData()).withJwtMacKey(this.jwtMacKey!)
  }
}
