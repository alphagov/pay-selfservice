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

  static fromJson (data) {
    if (!data) {
      return undefined
    }
    return new Token()
      .withDescription(data?.description)
      .withCreatedBy(data?.created_by)
      .withIssuedDate(data?.issued_date)
      .withLastUsed(data?.last_used)
  }
}

module.exports.Token = Token
