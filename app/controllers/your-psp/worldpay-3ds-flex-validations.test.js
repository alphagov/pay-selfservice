'use strict'

const worldpay3dsFlexValidations = require('./worldpay-3ds-flex-validations')

describe('Worldpay 3DS Flex validations', () => {
  describe('Organisational unit ID validations', () => {
    it('should be valid for valid organisational unit ID', () => {
      const orgUnitId = '5bd9b55e4444761ac0af1c80'
      expect(worldpay3dsFlexValidations.validateOrgUnitId(orgUnitId).valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid for invalid organisational unit ID', () => {
      const orgUnitId = 'not valid'
      expect(worldpay3dsFlexValidations.validateOrgUnitId(orgUnitId)).toEqual({
        valid: false,
        message: 'Enter your organisational unit ID in the format you received it'
      })
    })
  })

  describe('Issuer validations', () => {
    it('should be valid for valid issuer', () => {
      const issuer = '5bd9e0e4444dce153428c940'
      expect(worldpay3dsFlexValidations.validateIssuer(issuer).valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid for issuer', () => {
      const issuer = 'not valid'
      expect(worldpay3dsFlexValidations.validateIssuer(issuer)).toEqual({
        valid: false,
        message: 'Enter your issuer in the format you received it'
      })
    })
  })

  describe('JWT MAC key validations', () => {
    it('should be valid for valid JWT MAC key', () => {
      const jwtMacKey = 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
      expect(worldpay3dsFlexValidations.validateJwtMacKey(jwtMacKey).valid).toBe(true) // eslint-disable-line
    })

    it('should not be valid for invalid JWT MAC key', () => {
      const jwtMacKey = 'not valid'
      expect(worldpay3dsFlexValidations.validateJwtMacKey(jwtMacKey)).toEqual({
        valid: false,
        message: 'Enter your JWT MAC key in the format you received it'
      })
    })
  })
})
