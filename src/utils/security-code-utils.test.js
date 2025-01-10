const { expect } = require('chai')

const { sanitiseSecurityCode } = require('./security-code-utils')

describe('Security code utilities', () => {
  describe('sanitise security code', () => {
    it('should remove spaces, dashes and hyphens from code', () => {
      const output = sanitiseSecurityCode(' 01 23-34– - ')
      expect(output).to.equal('012334')
    })

    it('should return undefined when undefined code is provided', () => {
      const output = sanitiseSecurityCode(undefined)
      expect(output).to.equal(undefined)
    })
  })
})
