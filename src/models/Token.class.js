class Token {
  withDescription (description) {
    this.description = description
    return this
  }

  withCreatedBy (createdBy) {
    this.createdBy = createdBy
    return this
  }

  withIssuedDate (issuedDate) {
    this.issuedDate = issuedDate
    return this
  }

  withLastUsed (lastUsed) {
    this.lastUsed = lastUsed
    return this
  }

  withTokenLink (tokenLink) {
    this.tokenLink = tokenLink
    return this
  }

  withRevokedDate (revokedDate) {
    this.revokedDate = revokedDate
    return this
  }

  toJson () {
    return {
      ...this.description && { description: this.description },
      ...this.createdBy && { created_by: this.createdBy },
      ...this.issuedDate && { issued_date: this.issuedDate },
      ...this.tokenLink && { token_link: this.tokenLink },
      ...this.revokedDate && { revoked: this.revokedDate },
      ...this.lastUsed && { last_used: this.lastUsed }
    }
  }

  static fromJson (data) {
    if (!data) {
      return undefined
    }
    return new Token()
      .withDescription(data?.description)
      .withCreatedBy(data?.created_by)
      .withIssuedDate(data?.issued_date)
      .withLastUsed(data?.last_used)
      .withTokenLink(data?.token_link)
      .withRevokedDate(data?.revoked)
  }
}

module.exports.Token = Token
