class ApiKey {
  constructor (data) {
    this.createdBy = data.created_by
    this.description = data.description
    this.issuedDate = data.issued_date
    this.token = {
      link: data.token_link,
      type: data.token_type
    }
    this.type = data.type
  }
}

module.exports = ApiKey
