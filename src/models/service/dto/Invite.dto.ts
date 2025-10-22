export interface InviteData {
  links: LinkData[]
  attempt_counter: number
  disabled: boolean
  email: string
  expired: boolean
  inviteLink: string
  otp_key: string
  is_invite_to_join_service: boolean
  password_set: boolean
  role: string
  telephone_number: string
  user_exist: boolean
}

interface LinkData {
  href: string
  method: string
  rel: string
}
