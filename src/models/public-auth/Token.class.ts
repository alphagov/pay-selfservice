import { TokenData } from '@models/public-auth/dto/Token.dto'

export class Token {
  readonly description: string
  readonly createdBy: string
  readonly issuedDate: string
  readonly lastUsed: string
  readonly tokenLink: string
  readonly revokedDate: string

  constructor(data: TokenData) {
    this.description = data.description
    this.createdBy = data.created_by
    this.issuedDate = data.issued_date
    this.lastUsed = data.last_used
    this.tokenLink = data.token_link
    this.revokedDate = data.revoked
  }

  toJson(): TokenData {
    return {
      description: this.description,
      created_by: this.createdBy,
      issued_date: this.issuedDate,
      last_used: this.lastUsed,
      token_link: this.tokenLink,
      revoked: this.revokedDate
    }
  }
}
