import { CreateInviteRequestData } from '@models/service/dto/CreateInviteRequest.dto'

export class CreateInviteRequest {
  private inviteeEmailAddress!: string
  private senderUserExternalId!: string
  private serviceExternalId!: string
  private roleName!: string

  withInviteeEmailAddress(inviteeEmailAddress: string) {
    this.inviteeEmailAddress = inviteeEmailAddress
    return this
  }

  withSenderUserExternalId(senderUserExternalId: string) {
    this.senderUserExternalId = senderUserExternalId
    return this
  }

  withServiceExternalId(serviceExternalId: string) {
    this.serviceExternalId = serviceExternalId
    return this
  }

  withRoleName(roleName: string) {
    this.roleName = roleName
    return this
  }

  toJson(): CreateInviteRequestData {
    return {
      email: this.inviteeEmailAddress,
      sender: this.senderUserExternalId,
      service_external_id: this.serviceExternalId,
      role_name: this.roleName,
    }
  }
}
