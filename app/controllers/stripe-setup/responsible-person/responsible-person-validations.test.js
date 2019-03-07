'use strict'

// NPM dependencies
const { expect } = require('chai')
const moment = require('moment-timezone')

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

  describe('date of birth validations', () => {
    it('should be valid when date of birth in the past', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '6', '2000').valid).to.be.true // eslint-disable-line
    })

    it('should be valid when day has leading zero', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('01', '6', '2000').valid).to.be.true // eslint-disable-line
    })

    it('should be valid when month has leading zero', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '06', '2000').valid).to.be.true // eslint-disable-line
    })

    it('should not be valid nothing entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('', '', '')).to.deep.equal({
        valid: false,
        message: 'Enter the date of birth'
      })
    })

    it('should not be valid when no day entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('', '6', '2000')).to.deep.equal({
        valid: false,
        message: 'Date of birth must include a day'
      })
    })

    it('should not be valid when no month entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '', '2000')).to.deep.equal({
        valid: false,
        message: 'Date of birth must include a month'
      })
    })

    it('should not be valid when no year entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '6', '')).to.deep.equal({
        valid: false,
        message: 'Date of birth must include a year'
      })
    })

    it('should not be valid when no day and month entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('', '', '2000')).to.deep.equal({
        valid: false,
        message: 'Date of birth must include a day and month'
      })
    })

    it('should not be valid when no day and year entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('', '6', '')).to.deep.equal({
        valid: false,
        message: 'Date of birth must include a day and year'
      })
    })

    it('should not be valid when no month and year entered', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '', '')).to.deep.equal({
        valid: false,
        message: 'Date of birth must include a month and year'
      })
    })

    it('should not be valid when day does not contain numbers', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('cakeday', '6', '2000')).to.deep.equal({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when month does not contain numbers', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', 'Prairial', '2000')).to.deep.equal({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when year does not contain numbers', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '6', 'dragon')).to.deep.equal({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when year does not have four digits', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('10', '6', '00')).to.deep.equal({
        valid: false,
        message: 'Year must have 4 numbers'
      })
    })

    it('should not be valid when day is a negative number', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('-10', '6', '2000')).to.deep.equal({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when date does not exist', () => {
      expect(responsiblePersonValidations.validateDateOfBirth('29', '02', '1999')).to.deep.equal({
        valid: false,
        message: 'Enter a real date of birth'
      })
    })

    it('should not be valid when date is in the future', () => {
      const dateInTheMysteriousFuture = moment().add(1, 'days')

      expect(responsiblePersonValidations.validateDateOfBirth(dateInTheMysteriousFuture.date(),
        dateInTheMysteriousFuture.month() + 1, dateInTheMysteriousFuture.year())).to.deep.equal({
        valid: false,
        message: 'Date of birth must be in the past'
      })
    })
  })

})
