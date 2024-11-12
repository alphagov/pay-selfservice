const { expect } = require('chai')
const { responsiblePersonSchema } = require('./responsible-person.schema')
const { validationResult } = require('express-validator')

describe('Responsible Person Validation', () => {
  let req

  beforeEach(() => {
    req = {
      body: {
        firstName: 'Scrooge',
        lastName: 'McDuck',
        dobDay: '18',
        dobMonth: '09',
        dobYear: '1940',
        homeAddressLine1: 'McDuck Manor',
        homeAddressLine2: 'The Money Bin',
        homeAddressCity: 'Duckburg',
        homeAddressPostcode: 'SW1A 1AA',
        workTelephoneNumber: '01611234567',
        workEmail: 'scrooge.mcduck@pay.gov.uk'
      }
    }
  })

  describe('Name Validation', () => {
    it('should pass with valid first and last names', async () => {
      await responsiblePersonSchema.name.firstName.validate.run(req)
      await responsiblePersonSchema.name.lastName.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when first name is empty', async () => {
      req.body.firstName = ''
      await responsiblePersonSchema.name.firstName.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter your first name')
    })

    it('should fail when first name exceeds 100 characters', async () => {
      req.body.firstName = 'a'.repeat(101)
      await responsiblePersonSchema.name.firstName.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('First name must be 100 characters or fewer')
    })
  })

  describe('DOB Validation', () => {
    it('should pass with valid date of birth', async () => {
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobDay.validate.run(req)
      await responsiblePersonSchema.dob.dobMonth.validate.run(req)
      await responsiblePersonSchema.dob.dobYear.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when person is under 13', async () => {
      const currentYear = new Date().getFullYear()
      req.body.dobYear = currentYear - 12
      await responsiblePersonSchema.dob.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth cannot be younger than 13')
    })

    it('should fail when date is empty', async () => {
      req.body.dobDay = ''
      req.body.dobMonth = ''
      req.body.dobYear = ''
      await responsiblePersonSchema.dob.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter the date of birth')
    })

    it('should fail when day is empty', async () => {
      req.body.dobDay = ''
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobDay.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth must include a day')
    })

    it('should fail when month is empty', async () => {
      req.body.dobMonth = ''
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobMonth.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth must include a month')
    })

    it('should fail when year is empty', async () => {
      req.body.dobYear = ''
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobYear.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth must include a year')
    })

    it('should fail with invalid day', async () => {
      req.body.dobDay = '32'
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobDay.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Day of birth must be a number between 1 and 31')
    })

    it('should fail with invalid month', async () => {
      req.body.dobMonth = '13'
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobMonth.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Month of birth must be a number between 1 and 12')
    })

    it('should fail with invalid year', async () => {
      req.body.dobYear = '1899'
      await responsiblePersonSchema.dob.validate.run(req)
      await responsiblePersonSchema.dob.dobYear.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a valid year of birth')
    })
  })

  describe('Address Validation', () => {
    it('should pass with valid address', async () => {
      await responsiblePersonSchema.address.homeAddressLine1.validate.run(req)
      await responsiblePersonSchema.address.homeAddressCity.validate.run(req)
      await responsiblePersonSchema.address.homeAddressPostcode.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail with invalid postcode', async () => {
      req.body.homeAddressPostcode = 'not a postcode'
      await responsiblePersonSchema.address.homeAddressPostcode.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a real postcode')
    })

    it('should pass with empty address line 2', async () => {
      req.body.homeAddressLine2 = ''
      await responsiblePersonSchema.address.homeAddressLine2.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    const validPostcodes = [
      {
        postcode: 'SW1A 1AA',
        description: 'standard London postcode'
      },
      {
        postcode: 'SW1A1AA',
        description: 'standard London postcode no space'
      },
      {
        postcode: 'M2 3AA',
        description: 'short-form postcode'
      },
      {
        postcode: 'SK4 4PB',
        description: '6 character postcode'
      },
      {
        postcode: 'W1A 0AX',
        description: 'special case postcode'
      },
      {
        postcode: 'GIR 0AA',
        description: 'special case postcode'
      }
    ]

    validPostcodes.forEach(({ postcode, description }) => {
      it(`should validate ${description}: ${postcode}`, async () => {
        req.body.homeAddressPostcode = postcode
        await responsiblePersonSchema.address.homeAddressPostcode.validate.run(req)
        expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
      })
    })

    const invalidPostcodes = [
      {
        postcode: 'INVALID',
        description: 'completely invalid format'
      },
      {
        postcode: '123 456',
        description: 'numeric only'
      },
      {
        postcode: 'ABC DEF',
        description: 'letters only'
      },

      {
        postcode: 'SW1A 1AAA',
        description: 'too many characters'
      }
    ]

    invalidPostcodes.forEach(({ postcode, description }) => {
      it(`should reject invalid ${description}: ${postcode}`, async () => {
        req.body.homeAddressPostcode = postcode
        await responsiblePersonSchema.address.homeAddressPostcode.validate.run(req)
        const errors = validationResult(req)
        expect(errors.isEmpty()).to.be.false // eslint-disable-line
        expect(errors.array()[0].msg).to.equal('Enter a real postcode')
      })
    })
  })

  describe('Contact Details Validation', () => {
    it('should pass with valid contact details', async () => {
      await responsiblePersonSchema.contactDetails.workEmail.validate.run(req)
      await responsiblePersonSchema.contactDetails.workTelephoneNumber.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail with invalid email', async () => {
      req.body.workEmail = 'invalid-email'
      await responsiblePersonSchema.contactDetails.workEmail.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a real email address')
    })

    it('should fail with empty telephone number', async () => {
      req.body.workTelephoneNumber = ''
      await responsiblePersonSchema.contactDetails.workTelephoneNumber.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Work telephone number is required')
    })

    it('should fail with invalid telephone number', async () => {
      req.body.workTelephoneNumber = 'not a phone number'
      await responsiblePersonSchema.contactDetails.workTelephoneNumber.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a valid work telephone number')
    })
  })
})
