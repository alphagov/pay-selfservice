const { expect } = require('chai')
const { ONE_OFF_CUSTOMER_INITIATED_SCHEMA } = require('./validations.schema')
const { validationResult } = require('express-validator')

describe('One Off Customer Initiated Credentials Validation', () => {
  let req

  describe('Merchant Code Validation', () => {
    beforeEach(() => {
      req = {
        account: {
          allowMoto: false
        },
        body: {}
      }
    })

    it('should pass with valid merchant code', async () => {
      req.body.merchantCode = 'MCDUCKENTPROD'
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.merchantCode.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when merchant code is empty', async () => {
      req.body.merchantCode = ''
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.merchantCode.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter your merchant code')
    })
  })

  describe('MOTO Merchant Code Validation', () => {
    beforeEach(() => {
      req = {
        account: {
          allowMoto: true
        },
        body: {}
      }
    })

    const validTestCases = [
      { merchantCode: 'helloMOTO', desc: 'MOTO merchant code' },
      { merchantCode: 'helloMOTOGBP', desc: 'MOTOGBP merchant code' }
    ]

    validTestCases.forEach(({ merchantCode, desc }) => {
      it(`should pass with valid ${desc}`, async () => {
        req.body.merchantCode = merchantCode
        await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.merchantCode.validate.run(req)
        expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
      })
    })

    it('should fail when merchant code does not end with MOTO|MOTOGBP', async () => {
      req.body.merchantCode = 'hello'
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.merchantCode.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter a MOTO merchant code. MOTO payments are enabled for this account')
    })

    it('should fail when merchant code is empty', async () => {
      req.body.merchantCode = ''
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.merchantCode.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter your merchant code')
    })
  })

  describe('Username Validation', () => {
    beforeEach(() => {
      req = {
        account: {
          allowMoto: false
        },
        body: {}
      }
    })

    it('should pass with valid username', async () => {
      req.body.username = 's-mcduck'
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.username.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when username is empty', async () => {
      req.body.username = ''
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.username.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter your username')
    })
  })

  describe('Password Validation', () => {
    beforeEach(() => {
      req = {
        account: {
          allowMoto: false
        },
        body: {}
      }
    })

    it('should pass with valid password', async () => {
      req.body.password = 'topsecret!!!1' // pragma: allowlist secret
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.password.validate.run(req)
      expect(validationResult(req).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when password is empty', async () => {
      req.body.username = ''
      await ONE_OFF_CUSTOMER_INITIATED_SCHEMA.password.validate.run(req)
      const errors = validationResult(req)
      expect(errors.array()[0].msg).to.equal('Enter your password')
    })
  })
})
