const { expect } = require('chai')

const { isInternalGDSEmail } = require('./email-tools')

describe('Email tools', () => {
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
