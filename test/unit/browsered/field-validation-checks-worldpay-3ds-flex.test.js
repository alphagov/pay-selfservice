'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const { isNotWorldpay3dsFlexOrgUnitId, isNotWorldpay3dsFlexIssuer, isNotWorldpay3dsFlexJwtMacKey } =
    require('../../../app/browsered/field-validation-checks')

const invalidOrgUnitId = 'Enter your organisational unit ID in the format you received it'
const invalidIssuer = 'Enter your issuer in the format you received it'
const invalidJwtMacKey = 'Enter your JWT MAC key in the format you received it'

describe('Worldpay 3DS Flex credentials validations', () => {
  describe('Organisational unit ID validations', () => {
    it('should be valid when 24 lower-case hexadecimal characters', () => {
      expect(isNotWorldpay3dsFlexOrgUnitId('1234567890abcdef12345678')).to.be.false // eslint-disable-line
    })

    it('should not be valid any letter is upper-case', () => {
      expect(isNotWorldpay3dsFlexOrgUnitId('1234567890abcDef12345678')).to.be.equal(invalidOrgUnitId)
    })

    it('should not be valid when fewer than 24 characters', () => {
      expect(isNotWorldpay3dsFlexOrgUnitId('1234567890abcdef1234567')).to.be.equal(invalidOrgUnitId)
    })

    it('should not be valid when more than 24 characters', () => {
      expect(isNotWorldpay3dsFlexOrgUnitId('1234567890abcdef123456789')).to.be.equal(invalidOrgUnitId)
    })
  })

  describe('Issuer validations', () => {
    it('should be valid when 24 lower-case hexadecimal characters', () => {
      expect(isNotWorldpay3dsFlexIssuer('1234567890abcdef12345678')).to.be.false // eslint-disable-line
    })

    it('should not be valid when letters are upper-case', () => {
      expect(isNotWorldpay3dsFlexIssuer('1234567890ABCDEF12345678')).to.be.equal(invalidIssuer)
    })

    it('should not be valid when fewer than 24 characters', () => {
      expect(isNotWorldpay3dsFlexIssuer('1234567890abcdef1234567')).to.be.equal(invalidIssuer)
    })

    it('should not be valid when more than 24 characters', () => {
      expect(isNotWorldpay3dsFlexIssuer('1234567890abcdef123456789')).to.be.equal(invalidIssuer)
    })
  })

  describe('JWT MAC key validations', () => {
    it('should be valid when UUID in canonical 8-4-4-4-12 representation', () => {
      expect(isNotWorldpay3dsFlexJwtMacKey('abcdef12-3456-7890-abcd-ef1234567890')).to.be.false // eslint-disable-line
    })

    it('should not be valid when any letter is upper-case', () => {
      expect(isNotWorldpay3dsFlexJwtMacKey('abcdef12-3456-7890-abCd-ef1234567890')).to.be.equal(invalidJwtMacKey)
    })

    it('should not be valid when fewer than 36 characters', () => {
      expect(isNotWorldpay3dsFlexJwtMacKey('abcdef12-3456-7890-abcd-ef123456789')).to.be.equal(invalidJwtMacKey)
    })

    it('should not be valid when more than 36 characters', () => {
      expect(isNotWorldpay3dsFlexJwtMacKey('abcdef12-3456-7890-abcd-ef1234567890a')).to.be.equal(invalidJwtMacKey)
    })

    it('should not be valid when dashes in wrong places', () => {
      expect(isNotWorldpay3dsFlexJwtMacKey('abcdef-123456-7890-abcd-ef1234567890')).to.be.equal(invalidJwtMacKey)
    })
  })
})
