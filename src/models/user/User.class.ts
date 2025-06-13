import lodash from 'lodash'
import UserData from '@models/user/dto/User.dto'
import ServiceRole from '@models/service/ServiceRole.class'
import { isInternalGDSEmail } from '@utils/email-tools'

class User {
  readonly externalId: string
  readonly email: string
  readonly serviceRoles: ServiceRole[]
  readonly otpKey: string
  readonly telephoneNumber: string
  readonly disabled: boolean
  readonly sessionVersion: number
  readonly features: string[]
  readonly secondFactor: string
  readonly provisionalOtpKey: string
  readonly internalUser: boolean
  readonly numberOfLiveServices: number

  constructor (userData:UserData) {
    if (!userData) {
      throw Error('Must provide data')
    }
    this.externalId = userData.external_id
    this.email = userData.email ?? ''
    this.serviceRoles = userData.service_roles.map(serviceRoleData => new ServiceRole(serviceRoleData))
    this.otpKey = userData.otp_key ?? ''
    this.telephoneNumber = userData.telephone_number ?? ''
    this.disabled = userData.disabled ?? false
    this.sessionVersion = userData.session_version ?? 0
    this.features = (userData.features ?? '').split(',').map(feature => feature.trim())
    this.secondFactor = userData.second_factor
    this.provisionalOtpKey = userData.provisional_otp_key ?? ''
    this.internalUser = isInternalGDSEmail(this.email)
    this.numberOfLiveServices = this.serviceRoles.filter(serviceRole => serviceRole.service.currentGoLiveStage === 'LIVE').length
  }

  toJson () {
    const json = this.toMinimalJson()

    return lodash.merge(json, {
      disabled: this.disabled,
      session_version: this.sessionVersion
    })
  }

  toMinimalJson () {
    return {
      external_id: this.externalId,
      email: this.email,
      telephone_number: this.telephoneNumber,
      provisional_otp_key: this.provisionalOtpKey,
      second_factor: this.secondFactor,
      ...(this.otpKey && {otp_key: this.otpKey})
    }
  }

  hasFeature (featureName: string) {
    return this.features.includes(featureName)
  }

  hasPermission (serviceExternalId: string, permissionName: string) {
    return lodash.get(this.getRoleForService(serviceExternalId), 'permissions', [])
      .map(permission => permission.name)
      .includes(permissionName)
  }

  getRoleForService (serviceExternalId: string) {
    const serviceRole = this.serviceRoles.find(serviceRole => serviceRole.service.externalId === serviceExternalId)
    return lodash.get(serviceRole, 'role')
  }

  hasService (serviceExternalId: string) {
    return this.serviceRoles.map(serviceRole => serviceRole.service.externalId).includes(serviceExternalId)
  }

  getPermissionsForService (serviceExternalId: string) {
    return lodash.get(this.getRoleForService(serviceExternalId), 'permissions', []).map(permission => permission.name)
  }

  isAdminUserForService (serviceExternalId: string) {
    return this.serviceRoles
      .filter(serviceRole => serviceRole.role && serviceRole.role.name === 'admin' &&
        serviceRole.service && serviceRole.service.externalId === serviceExternalId)
      .length > 0
  }
}

export = User
