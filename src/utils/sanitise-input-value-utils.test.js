const { expect } = require('chai')

const { sanitiseHtmlValue } = require('./sanitise-input-value-utils')
const { sanitiseSecurityCode } = require('./sanitise-input-value-utils')

describe('Sanitise input values utilities', () => {
  describe('sanitise values code', () => {
    it('should remove html markers', () => {
      let output = sanitiseHtmlValue(
        '<a href="https://www.w3schools.com">Visit W3Schools</a> <h1><td>We are the champions!</td></h1>'
      )
      expect(output).to.equal('Visit W3Schools We are the champions!')
    })

    it('should return undefined when undefined code is provided', () => {
      const output = sanitiseHtmlValue(undefined)
      expect(output).to.equal(undefined)
    })
  })

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
