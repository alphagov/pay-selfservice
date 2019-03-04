'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const responsiblePersonValidations = require('./responsible-person-validations')

const BLANK_TEXT = ''
const MAX_LENGTH = 25
const LOOOONG_TEXT = 'abcdefghijklmnopqrstuvwxyz'

describe('Responsible person page field validations', () => {
  describe('optional text field validations', () => {
    it('should validate that optional text is valid', () => {
      expect(responsiblePersonValidations.validateOptionalField('some text', MAX_LENGTH).valid).to.be.true // eslint-disable-line
    })

    it('should validate that blank text is valid', () => {
      expect(responsiblePersonValidations.validateOptionalField(BLANK_TEXT).valid).to.be.true // eslint-disable-line
    })

    it('should not be valid when optional text is too long', () => {
      expect(responsiblePersonValidations.validateOptionalField(LOOOONG_TEXT, MAX_LENGTH)).to.deep.equal({
        valid: false,
        message: 'The text is too long'
      })
    })
  })

  describe('mandatory text field validations', () => {
    it('should validate that mandatory text is valid', () => {
      expect(responsiblePersonValidations.validateMandatoryField('some text', MAX_LENGTH).valid).to.be.true // eslint-disable-line
    })

    it('should not be valid when mandatory text is blank', () => {
      expect(responsiblePersonValidations.validateMandatoryField(BLANK_TEXT, MAX_LENGTH)).to.deep.equal({
        valid: false,
        message: 'This field cannot be blank'
      })
    })

    it('should not be valid when mandatory text is too long', () => {
      expect(responsiblePersonValidations.validateMandatoryField(LOOOONG_TEXT, MAX_LENGTH)).to.deep.equal({
        valid: false,
        message: 'The text is too long'
      })
    })
  })

  describe('postcode validations', () => {
    it('should be valid when UK postcode', () => {
      expect(responsiblePersonValidations.validatePostcode('NW1 5GH').valid).to.be.true // eslint-disable-line
    })

    it('should not be valid when postcode is blank', () => {
      expect(responsiblePersonValidations.validatePostcode(BLANK_TEXT)).to.deep.equal({
        valid: false,
        message: 'This field cannot be blank'
      })
    })

    it('should not be valid when postcode is not UK postcode', () => {
      expect(responsiblePersonValidations.validatePostcode('CA90210')).to.deep.equal({
        valid: false,
        message: 'Please enter a real postcode'
      })
    })
  })

})
