const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const { constants } = require('@govuk-pay/pay-js-commons')
const { Webhook } = require('@models/webhooks/Webhook.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const GATEWAY_ACCOUNT_ID = '100'

const testWebhook = new Webhook()
  .withCallbackUrl('https://www.globexcorporation.example.com')
const mockResponse = sinon.spy()
const mockUpdateWebhook = sinon.stub().resolves({})
const mockGetWebhook = sinon.stub().resolves(testWebhook)
const mockUpdateWebhookDomainNotAllowed = sinon.stub().rejects(new RESTClientError(null, 'webhooks', 400, 'CALLBACK_URL_NOT_ON_ALLOW_LIST'))

const { req, res, call, nextRequest, nextStubs } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/update/update-webhook.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: ACCOUNT_TYPE
  })
  .withParams({ webhookExternalId: 'webhook-external-id' })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/webhooks.service': { updateWebhook: mockUpdateWebhook, getWebhook: mockGetWebhook }
  })
  .build()

describe('Controller: settings/webhooks/update', () => {
  describe('get', () => {
    before(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      mockResponse.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
    })

    it('should pass req, res and template path to the response method', () => {
      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/webhooks/edit')
    })

    it('should pass context data to the response method', () => {
      mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        form: {
          callbackUrl: 'https://www.globexcorporation.example.com', description: undefined, subscriptions: undefined
        },
        eventTypes: constants.webhooks.humanReadableSubscriptions,
        backLink: '/simplified/service/service-id-123abc/account/test/settings/webhooks'
      })
    })

    it('should call the webhooks service to find the webhook', () => {
      mockGetWebhook.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
      mockGetWebhook.should.have.been.calledWith('webhook-external-id', SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_ID)
    })
  })

  describe('post', () => {
    describe('when the updates are valid', () => {
      before(async () => {
        nextRequest({
          body: {
            callbackUrl: 'https://www.compuglobalhypermeganet.example.com',
            description: 'Webhook description',
            subscriptions: 'card_payment_succeeded'
          }
        })
        await call('post')
      })

      it('should call the webhook service to update the webhook', () => {
        mockUpdateWebhook.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
      })

      it('should redirect to the webhook detail page', () => {
        res.redirect.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        res.redirect.should.have.been.calledWith('/simplified/service/service-id-123abc/account/test/settings/webhooks/webhook-external-id')
      })
    })

    describe('when there are validation errors', () => {
      before(async () => {
        nextRequest({
          body: {
            callbackUrl: 'not-a-valid-url',
            description: 'this is a really long webhook description that exceeds the maximum fifty character limit',
            subscriptions: 'not a valid payment event'
          }
        })
        nextStubs({
          '@controllers/simplified-account/settings/webhooks/create/create.controller': { responseWithErrors: mockResponse }
        })
        await call('post')
      })

      it('should respond with error message', () => {
        mockResponse.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, {
          errorSummary: [
            { text: 'Select from the list of payment events', href: '#subscriptions' },
            { text: 'Enter a valid callback url beginning with https://', href: '#callback-url' },
            { text: 'Description must be 50 characters or fewer', href: '#description' }
          ],
          formErrors: { subscriptions: 'Select from the list of payment events', callbackUrl: 'Enter a valid callback url beginning with https://', description: 'Description must be 50 characters or fewer' }
        })
      })
    })

    describe('when the domain not in the allow list', () => {
      before(async () => {
        nextRequest({
          body: {
            callbackUrl: 'https://www.gov.uk',
            description: 'Webhook description',
            subscriptions: 'card_payment_succeeded'
          }
        })
        nextStubs({
          '@controllers/simplified-account/settings/webhooks/create/create.controller': { responseWithErrors: mockResponse },
          '@services/webhooks.service': { updateWebhook: mockUpdateWebhookDomainNotAllowed }
        })
        await call('post')
      })

      it('should respond with error message', () => {
        mockUpdateWebhookDomainNotAllowed.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockResponse.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, {
          errorSummary: [{ text: 'Callback URL must be approved. Please contact support', href: '#callback-url' }],
          formErrors: { callbackUrl: 'Callback URL must be approved. Please contact support' }
        })
      })
    })

    describe('when the callback URL is not https', () => {
      before(async () => {
        nextRequest({
          body: {
            callbackUrl: 'http://www.gov.uk',
            description: 'Webhook description',
            subscriptions: 'card_payment_succeeded'
          }
        })
        nextStubs({
          '@controllers/simplified-account/settings/webhooks/create/create.controller': { responseWithErrors: mockResponse }
        })
        await call('post')
      })

      it('should respond with error message', () => {
        mockResponse.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, {
          errorSummary: [{ text: 'Enter a valid callback url beginning with https://', href: '#callback-url' }],
          formErrors: { callbackUrl: 'Enter a valid callback url beginning with https://' }
        })
      })
    })
  })
})
