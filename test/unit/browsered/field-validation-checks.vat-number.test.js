'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const { isNotVatNumber } = require('../../../app/browsered/field-validation-checks')

describe('isNotVatNumber', () => {
  const standardVatNumber = 'GB999 9999 73'
  const standardVatNumberInNonStandardFormat = `  g B 9  
        99 999 9 7 3   `
  const governmentDepartmentsVatNumber = 'GBGD001'
  const governmentDepartmentsVatNumberInNonStandardFormat = ` g BG 
        d 001    `
  const branchTradersVatNumber = 'GB123456789123'
  const branchTradersVatNumberInNonStandardFormat = ` gb 123456789 
        123     `
  const healthAuthoritiesVatNumber = 'GBHA599'
  const healthAuthoritiesVatNumberInNonStandardFormat = `gb HA 
        599   `

  describe('UK VAT number validations', () => {
    it('should validate that Standard VAT numbers are valid', () => {
      expect(isNotVatNumber(standardVatNumber)).to.be.false // eslint-disable-line
    })

    it('should validate that Standard VAT numbers are valid (in non standard format)', () => {
      expect(isNotVatNumber(standardVatNumberInNonStandardFormat)).to.be.false // eslint-disable-line
    })

    it('should validate that Government Department VAT numbers are valid', () => {
      expect(isNotVatNumber(governmentDepartmentsVatNumber)).to.be.false // eslint-disable-line
    })

    it('should validate that Government Department VAT numbers are valid (in non standard format)', () => {
      expect(isNotVatNumber(governmentDepartmentsVatNumberInNonStandardFormat)).to.be.false // eslint-disable-line
    })

    it('should validate that Branch Trader VAT numbers are valid', () => {
      expect(isNotVatNumber(branchTradersVatNumber)).to.be.false // eslint-disable-line
    })

    it('should validate that Branch Trader VAT numbers are valid (in non standard format)', () => {
      expect(isNotVatNumber(branchTradersVatNumberInNonStandardFormat)).to.be.false // eslint-disable-line
    })

    it('should validate that Health Authority VAT numbers are valid', () => {
      expect(isNotVatNumber(healthAuthoritiesVatNumber)).to.be.false // eslint-disable-line
    })

    it('should validate that Health Authority VAT numbers are valid (in non standard format)', () => {
      expect(isNotVatNumber(healthAuthoritiesVatNumberInNonStandardFormat)).to.be.false // eslint-disable-line
    })

    it('should not be valid when mandatory text is blank', () => {
      expect(isNotVatNumber('')).to.be.equal('Enter a valid VAT number')
    })

    it('should not be valid when mandatory text is too long', () => {
      expect(isNotVatNumber('GB999 9999 7333333333333')).to.be.equal('Enter a valid VAT number')
    })

    it('should not be valid when mandatory text is invalid VAT number', () => {
      expect(isNotVatNumber('BADD000')).to.be.equal('Enter a valid VAT number')
    })
  })
})
