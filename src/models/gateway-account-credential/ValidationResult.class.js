class ValidationResult {
  /**
   *
   * @param {String} result
   */
  withResult (result) {
    if (result) {
      this.result = result
    }
    return this
  }

  /**
   *
   * @param data
   * @returns {ValidationResult}
   */
  static fromJson (data) {
    return new ValidationResult()
      .withResult(data?.result)
  }
}

module.exports = ValidationResult
