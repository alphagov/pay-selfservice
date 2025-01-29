const { expect } = require('chai')
const { webhookSchema } = require('./webhook.schema')
const { validationResult } = require('express-validator')

describe('Webhook Validation', () => {
  let BASE_REQ
  beforeEach(() => {
    BASE_REQ = {
      body: {
        callbackUrl: 'https://www.gov.uk',
        description: 'A valid webhook description',
        subscriptions: ['card_payment_succeeded', 'card_payment_failed']
      }
    }
  })

  describe('Callback url validation', () => {
    it('should pass with a valid callback url', async () => {
      await webhookSchema.callbackUrl.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when callback url is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { callbackUrl: '' })
      }
      await webhookSchema.callbackUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a callback url')
    })

    it('should fail when callback url is http', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { callbackUrl: 'http://www.gov.uk' })
      }
      await webhookSchema.callbackUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a valid callback url beginning with https://')
    })

    it('should fail when callback url is malformed', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { callbackUrl: 'https://malformed-url' })
      }
      await webhookSchema.callbackUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a valid callback url beginning with https://')
    })
  })

  describe('description validation', () => {
    it('should pass with a valid description', async () => {
      await webhookSchema.description.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when description is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { description: '' })
      }
      await webhookSchema.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a description')
    })

    it('should fail when description is too long', async () => {
      const invalidReq = {
        body: Object.assign({}, BASE_REQ.body, { description: 'This 41 character description is too long' })
      }
      await webhookSchema.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Description must be 40 characters or fewer')
    })
  })

  describe('subscriptions validation', () => {
    it('should pass with more than one subscriptions', async () => {
      await webhookSchema.subscriptions.validate.run(BASE_REQ)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should pass with one subscription', async () => {
      const validReq = {
        body: Object.assign({}, BASE_REQ.body, { subscriptions: 'card_payment_succeeded' })
      }
      await webhookSchema.subscriptions.validate.run(validReq)
      expect(validationResult(BASE_REQ).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail with no subscriptions', async () => {
      const invalidReq = {
        body: {
          callbackUrl: 'https://www.gov.uk',
          description: 'A valid webhook description'
        }
      }
      await webhookSchema.subscriptions.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Select at least one payment event')
    })
  })

})
