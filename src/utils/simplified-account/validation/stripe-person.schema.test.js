const { expect } = require('chai')
const { stripePersonSchema } = require('./stripe-person.schema')
const { validationResult } = require('express-validator')

describe('Stripe Person Validation', () => {
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
      await stripePersonSchema.name.firstName.validate.run(req)
      await stripePersonSchema.name.lastName.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
    })

    it('should fail when first name is empty', async () => {
      req.body.firstName = ''
      await stripePersonSchema.name.firstName.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter the first name')
    })

    it('should fail when first name exceeds 100 characters', async () => {
      req.body.firstName = 'a'.repeat(101)
      await stripePersonSchema.name.firstName.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('First name must be 100 characters or fewer')
    })
  })

  describe('DOB Validation', () => {
    it('should pass with valid date of birth', async () => {
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobDay.validate.run(req)
      await stripePersonSchema.dob.dobMonth.validate.run(req)
      await stripePersonSchema.dob.dobYear.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
    })

    it('should fail when person is under 13', async () => {
      const currentYear = new Date().getFullYear()
      req.body.dobYear = currentYear - 12
      await stripePersonSchema.dob.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth cannot be younger than 13')
    })

    it('should fail when date is empty', async () => {
      req.body.dobDay = ''
      req.body.dobMonth = ''
      req.body.dobYear = ''
      await stripePersonSchema.dob.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter the date of birth')
    })

    it('should fail when day is empty', async () => {
      req.body.dobDay = ''
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobDay.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth must include a day')
    })

    it('should fail when month is empty', async () => {
      req.body.dobMonth = ''
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobMonth.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth must include a month')
    })

    it('should fail when year is empty', async () => {
      req.body.dobYear = ''
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobYear.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Date of birth must include a year')
    })

    it('should fail with invalid day', async () => {
      req.body.dobDay = '32'
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobDay.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Day of birth must be a number between 1 and 31')
    })

    it('should fail with invalid month', async () => {
      req.body.dobMonth = '13'
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobMonth.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Month of birth must be a number between 1 and 12')
    })

    it('should fail with invalid year', async () => {
      req.body.dobYear = '1899'
      await stripePersonSchema.dob.validate.run(req)
      await stripePersonSchema.dob.dobYear.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a valid year of birth')
    })
  })

  describe('Address Validation', () => {
    it('should pass with valid address', async () => {
      await stripePersonSchema.address.homeAddressLine1.validate.run(req)
      await stripePersonSchema.address.homeAddressCity.validate.run(req)
      await stripePersonSchema.address.homeAddressPostcode.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
    })

    it('should fail with invalid postcode', async () => {
      req.body.homeAddressPostcode = 'not a postcode'
      await stripePersonSchema.address.homeAddressPostcode.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a real postcode')
    })

    it('should pass with empty address line 2', async () => {
      req.body.homeAddressLine2 = ''
      await stripePersonSchema.address.homeAddressLine2.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
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
        await stripePersonSchema.address.homeAddressPostcode.validate.run(req)
        expect(validationResult(req).isEmpty()).to.be.true
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
        await stripePersonSchema.address.homeAddressPostcode.validate.run(req)
        const errors = validationResult(req)
        expect(errors.isEmpty()).to.be.false
        expect(errors.array()[0].msg).to.equal('Enter a real postcode')
      })
    })
  })

  describe('Contact Details Validation', () => {
    it('should pass with valid contact details', async () => {
      await stripePersonSchema.contactDetails.workEmail.validate.run(req)
      await stripePersonSchema.contactDetails.workTelephoneNumber.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true
    })

    it('should fail with invalid email', async () => {
      req.body.workEmail = 'invalid-email'
      await stripePersonSchema.contactDetails.workEmail.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a real email address')
    })

    it('should fail with empty telephone number', async () => {
      req.body.workTelephoneNumber = ''
      await stripePersonSchema.contactDetails.workTelephoneNumber.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Work telephone number is required')
    })

    it('should fail with invalid telephone number', async () => {
      req.body.workTelephoneNumber = 'not a phone number'
      await stripePersonSchema.contactDetails.workTelephoneNumber.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a valid work telephone number')
    })
  })
})
