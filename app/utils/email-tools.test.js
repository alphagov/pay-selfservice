const { expect } = require('chai')

const { isValidEmail, isInternalGDSEmail } = require('./email-tools')

describe('Email tools', () => {
  describe('isValidEmail', () => {
    it('should return false for an invalid email', () => {
      const result = isValidEmail('abc')
      expect(result).to.equal(false)
    })

    it('should return false for email with invalid domain', () => {
      const result = isValidEmail('abc@example')
      expect(result).to.equal(false)
    })

    it('should return true for a valid email', () => {
      const result = isValidEmail('abc@example.com')
      expect(result).to.equal(true)
    })
  })

  describe('isInternalGDSEmail', () => {
    beforeEach(() => {
      process.env.GDS_INTERNAL_USER_EMAIL_DOMAIN = '@example.org'
    })

    it('should return false when email does not have internal user domain', () => {
      const result = isInternalGDSEmail('someone@example.com')
      expect(result).to.equal(false)
    })
    it('should return true when email does have internal user domain', function () {
      const result = isInternalGDSEmail('someone@example.org')
      expect(result).to.equal(true)
    })
  })
})
