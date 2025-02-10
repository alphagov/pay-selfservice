const { expect } = require('chai')
const { webhookSchema } = require('./webhook.schema')
const { validationResult } = require('express-validator')

describe('Webhook Validation', () => {
  let VALID_REQUEST
  beforeEach(() => {
    VALID_REQUEST = {
      body: {
        callbackUrl: 'https://www.gov.uk',
        description: 'A valid webhook description',
        subscriptions: ['card_payment_succeeded', 'card_payment_failed']
      }
    }
  })

  describe('Callback url validation', () => {
    it('should pass with a valid callback url', async () => {
      await webhookSchema.callbackUrl.validate.run(VALID_REQUEST)
      expect(validationResult(VALID_REQUEST).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when callback url is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, VALID_REQUEST.body, { callbackUrl: '' })
      }
      await webhookSchema.callbackUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a callback url')
    })

    it('should fail when callback url is http', async () => {
      const invalidReq = {
        body: Object.assign({}, VALID_REQUEST.body, { callbackUrl: 'http://www.gov.uk' })
      }
      await webhookSchema.callbackUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a valid callback url beginning with https://')
    })

    it('should fail when callback url is malformed', async () => {
      const invalidReq = {
        body: Object.assign({}, VALID_REQUEST.body, { callbackUrl: 'https://malformed-url' })
      }
      await webhookSchema.callbackUrl.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a valid callback url beginning with https://')
    })
  })

  describe('description validation', () => {
    it('should pass with a valid description', async () => {
      await webhookSchema.description.validate.run(VALID_REQUEST)
      expect(validationResult(VALID_REQUEST).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should fail when description is empty', async () => {
      const invalidReq = {
        body: Object.assign({}, VALID_REQUEST.body, { description: '' })
      }
      await webhookSchema.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Enter a description')
    })

    it('should fail when description is too long', async () => {
      const invalidReq = {
        body: Object.assign({}, VALID_REQUEST.body, { description: 'This description has 51 characters which is too big' })
      }
      await webhookSchema.description.validate.run(invalidReq)
      const errors = validationResult(invalidReq)
      expect(errors.array()[0].msg).to.equal('Description must be 50 characters or fewer')
    })
  })

  describe('subscriptions validation', () => {
    it('should pass with more than one subscriptions', async () => {
      await webhookSchema.subscriptions.validate.run(VALID_REQUEST)
      expect(validationResult(VALID_REQUEST).isEmpty()).to.be.true // eslint-disable-line
    })

    it('should pass with one subscription', async () => {
      const validRequestWithOneSubscription = {
        body: Object.assign({}, VALID_REQUEST.body, { subscriptions: 'card_payment_succeeded' })
      }
      await webhookSchema.subscriptions.validate.run(validRequestWithOneSubscription)
      expect(validationResult(validRequestWithOneSubscription).isEmpty()).to.be.true // eslint-disable-line
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
