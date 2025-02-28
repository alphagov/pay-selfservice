const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const paths = require('@root/paths')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const { constants } = require('@govuk-pay/pay-js-commons')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { Webhook } = require('@models/webhooks/Webhook.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const testWebhook = new Webhook()
  .withCallbackUrl('https://www.globexcorporation.example.com')
const mockResponse = sinon.spy()
const mockUpdateWebhook = sinon.stub().resolves({})
const mockGetWebhook = sinon.stub().resolves(testWebhook)
const mockUpdateWebhookDomainNotAllowed = sinon.stub().rejects(new RESTClientError(null, 'webhooks', 400, 'CALLBACK_URL_NOT_ON_ALLOW_LIST'))

const { req, res, call, nextRequest, nextStubs } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/update/update-webhook.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
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
  })

  describe('post', () => {
    describe('success', () => {
      before(async () => {
        nextRequest({
          body: {
            callbackUrl: 'https://www.compuglobalhypermeganet.example.com',
            description: 'Webhook description',
            subscriptions: 'Payment created'
          }
        })
        await call('post')
      })

      it('should call the webhook service to update the webhook', () => {
        mockUpdateWebhook.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
      })

      it('should redirect to the webhooks index page', () => {
        res.redirect.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        res.redirect.should.have.been.calledWith('/simplified/service/service-id-123abc/account/test/settings/webhooks')
      })
    })

    describe('failure - domain not in allow list', () => {
      before(async () => {
        nextRequest({
          body: {
            callbackUrl: 'https://www.gov.uk',
            description: 'Webhook description',
            subscriptions: 'Payment created'
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
  })
})
