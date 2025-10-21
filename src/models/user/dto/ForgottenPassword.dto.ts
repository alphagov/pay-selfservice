export interface ForgottenPasswordData {
  _links: LinkData[]
  code: string
  date: string
  user_external_id: string
}

interface LinkData {
  href: string
  method: string
  rel: string
}
