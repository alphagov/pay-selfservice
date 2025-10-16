import { InviteData } from '@models/service/dto/Invite.dto'

export class Invite {
  readonly links: Link[]
  readonly attemptCounter: number
  readonly disabled: boolean
  readonly email: string
  readonly expired: boolean
  readonly inviteLink: string
  readonly otpKey: string
  readonly isInviteToJoinService: boolean
  readonly passwordSet: boolean
  readonly role: string
  readonly telephoneNumber: string
  readonly userExists: boolean

  constructor(inviteData: InviteData) {
    this.links = inviteData.links
    this.attemptCounter = inviteData.attempt_counter
    this.disabled = inviteData.disabled
    this.email = inviteData.email
    this.expired = inviteData.expired
    this.inviteLink = inviteData.inviteLink
    this.otpKey = inviteData.otp_key
    this.isInviteToJoinService = inviteData.is_invite_to_join_service
    this.passwordSet = inviteData.password_set
    this.role = inviteData.role
    this.telephoneNumber = inviteData.telephone_number
    this.userExists = inviteData.user_exist
  }
}

interface Link {
  href: string
  method: string
  rel: string
}
