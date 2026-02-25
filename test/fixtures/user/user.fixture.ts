import UserData from '@models/user/dto/User.dto'
import User from '@models/user/User.class'
import { ServiceRoleFixture } from '@test/fixtures/user/service-role.fixture'

export class UserFixture {
  readonly externalId: string
  readonly email: string
  readonly serviceRoles: ServiceRoleFixture[]
  readonly otpKey: string
  readonly telephoneNumber: string
  readonly disabled: boolean
  readonly sessionVersion: number
  readonly features: string[]
  readonly secondFactor: string
  readonly provisionalOtpKey: string
  readonly internalUser: boolean
  readonly numberOfLiveServices: number

  constructor(overrides?: Partial<UserData>) {
    this.externalId = 'user-123-external-id'
    this.email = 'homer.simpson@example.com'
    this.serviceRoles = [new ServiceRoleFixture()]
    this.otpKey = 'OTPKEY'
    this.telephoneNumber = ''
    this.disabled = false
    this.sessionVersion = 1
    this.features = []
    this.secondFactor = 'APP'
    this.provisionalOtpKey = ''
    this.internalUser = false
    this.numberOfLiveServices = 1

    if (overrides) {
      Object.assign(this, overrides)
    }
  }

  toUserData(): UserData {
    return {
      external_id: this.externalId,
      email: this.email,
      service_roles: this.serviceRoles.map((serviceRole) => serviceRole.toServiceRoleData()),
      otp_key: this.otpKey,
      telephone_number: this.telephoneNumber,
      disabled: this.disabled,
      session_version: this.sessionVersion,
      features: this.features.join(','),
      second_factor: this.secondFactor,
      provisional_otp_key: this.provisionalOtpKey,
    }
  }

  toUser(): User {
    return new User(this.toUserData())
  }
}
