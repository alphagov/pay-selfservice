const { expect } = require('chai')
const { organisationDetailsSchema } = require('./organisation-details.schema')
const { validationResult } = require('express-validator')

describe('Organisation details Validation', () => {
  let BASE_REQ
  beforeEach(() => {
    BASE_REQ = {
      body: {
        organisationName: 'Compu-Global-Hyper-Mega-Net',
        addressLine1: '742',
        addressLine2: 'Evergreen Terrace',
        addressCity: 'Springfield',
        addressCountry: 'US',
        addressPostcode: 'NT1A 1AA',
        telephoneNumber: '01611234567',
        organisationUrl: 'https://www.compuglobalhypermeganet.example.com'
      }
    }
  })

  describe('Organisation name Validation', () => {
    it('should pass with a valid organisation name', async () => {
      await organisationDetailsSchema.organisationName.validate.run(BASE_REQ)
      console.log(validationResult(BASE_REQ))
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when first name is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { organisationName: '' })
      }
      await organisationDetailsSchema.organisationName.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter an organisation name')
    })

    it('should fail when organisation name exceeds 100 characters', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { organisationName: 'a'.repeat(101) })
      }
      await organisationDetailsSchema.organisationName.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Organisation name must be 100 characters or fewer')
    })
  })

  describe('Address Validation', () => {
    it('should pass with a valid address', async () => {
      await organisationDetailsSchema.organisationAddress.line1.validate.run(BASE_REQ)
      await organisationDetailsSchema.organisationAddress.line2.validate.run(BASE_REQ)
      await organisationDetailsSchema.organisationAddress.city.validate.run(BASE_REQ)
      await organisationDetailsSchema.organisationAddress.postcode.validate.run(BASE_REQ)
      await organisationDetailsSchema.organisationAddress.country.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should pass with empty address line 2', async () => {
      const validReq = {
        body: Object.assign({}, BASE_REQ.body, { addressLine2: '' })
      }
      await organisationDetailsSchema.organisationAddress.line2.validate.run(validReq)
      expect(validationResult(validReq).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when city is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressCity: '' })
      }
      await organisationDetailsSchema.organisationAddress.city.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a town or city')
    })

    it('should fail when city exceeds 255 characters', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressCity: 'a'.repeat(256) })
      }
      await organisationDetailsSchema.organisationAddress.city.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Town or city must be 255 characters or fewer')
    })

    it('should fail when postcode is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressPostcode: '' })
      }
      await organisationDetailsSchema.organisationAddress.postcode.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a postcode')
    })

    it('should fail with invalid postcode', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressPostcode: 'not a postcode' })
      }
      await organisationDetailsSchema.organisationAddress.postcode.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a real postcode')
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
        const validReq = {
          body: Object.assign({}, BASE_REQ.body, { addressPostcode: postcode })
        }
        await organisationDetailsSchema.organisationAddress.postcode.validate.run(validReq)
        expect(validationResult(validReq).isEmpty()).to.be.true // eslint-disable-line
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
        const invalidReq = {
          body: Object.assign({}, BASE_REQ.body, { addressPostcode: postcode })
        }
        await organisationDetailsSchema.organisationAddress.postcode.validate.run(invalidReq)
        const errors = validationResult(invalidReq)
        expect(errors.isEmpty()).to.be.false // eslint-disable-line
        expect(errors.array()[0].msg).to.equal('Enter a real postcode')
      })
    })

    it('should fail when country is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressCountry: '' })
      }
      await organisationDetailsSchema.organisationAddress.country.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Select a country')
    })

    it('should fail when country is shorter than 2 characters', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressCountry: 'A' })
      }
      await organisationDetailsSchema.organisationAddress.country.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Select a country')
    })

    it('should fail when country is longer than 2 characters', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { addressCountry: 'AAA' })
      }
      await organisationDetailsSchema.organisationAddress.country.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Select a country')
    })
  })

  describe('Telephone number validation', () => {
    it('should pass with a valid telephone number', async () => {
      await organisationDetailsSchema.telephoneNumber.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail with empty telephone number', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { telephoneNumber: '' })
      }
      await organisationDetailsSchema.telephoneNumber.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a telephone number')
    })

    it('should fail with invalid telephone number', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { telephoneNumber: 'not a phone number' })
      }
      await organisationDetailsSchema.telephoneNumber.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
    })
  })

  describe('Organisaiton URL validation', () => {
    it('should pass with a valid URL', async () => {
      await organisationDetailsSchema.organisationUrl.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail with an empty url', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { organisationUrl: '' })
      }
      await organisationDetailsSchema.organisationUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a website address')
    })

    it('should fail with an invalid url', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { organisationUrl: 'not-a-valid-url' })
      }
      await organisationDetailsSchema.organisationUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a valid website address')
    })

    it('should fail with when missing a url protocol', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { organisationUrl: 'nohttp.exmaple.com' })
      }
      await organisationDetailsSchema.organisationUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a valid website address')
    })
  })
})
