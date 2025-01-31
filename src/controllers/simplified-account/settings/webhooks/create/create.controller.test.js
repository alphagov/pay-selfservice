const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const paths = require('@root/paths')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const mockResponse = sinon.spy()
const mockCreateWebhook = sinon.stub().resolves({})
const mockCreateWebhookDomainNotAllowed = sinon.stub().rejects(new RESTClientError(null, 'webhooks', 400, 'CALLBACK_URL_NOT_ON_ALLOW_LIST'))

const { req, res, call, nextRequest, nextStubs } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/create/create.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/webhooks.service': { createWebhook: mockCreateWebhook }

  })
  .build()

describe('Controller: settings/webhooks', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/webhooks/create')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('eventTypes').to.have.property('CARD_PAYMENT_SUCCEEDED').to.equal('Payment succeeded')
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal('/simplified/service/service-id-123abc/account/test/settings/webhooks')
    })
  })

  describe('post', () => {
    describe('success', () => {
      before(() => {
        nextRequest({
          body: {
            callbackUrl: 'https://www.gov.uk',
            description: 'Webhook description',
            subscriptions: 'Payment created'
          }
        })
        call('post')
      })

      it('should call webhooks to create a webhook', () => {
        expect(mockCreateWebhook.called).to.be.true // eslint-disable-line
      })

      it('should redirect to the webhooks index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.webhooks.index)
      })
    })

    describe('failure - domain not in allow list', () => {
      before(() => {
        nextRequest({
          body: {
            callbackUrl: 'https://www.gov.uk',
            description: 'Webhook description',
            subscriptions: 'Payment created'
          }
        })
        nextStubs({
          '@utils/response': { response: mockResponse },
          '@services/webhooks.service': { createWebhook: mockCreateWebhookDomainNotAllowed }
        })
        call('post')
      })

      it('should respond with error message', () => {
        expect(mockCreateWebhookDomainNotAllowed.called).to.be.true // eslint-disable-line
        expect(mockResponse.calledOnce).to.be.true // eslint-disable-line
        expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/webhooks/create')
        expect(mockResponse.args[0][3]).to.have.property('errors').to.deep.equal({
          summary: [{ text: 'Callback URL must be approved. Please contact support', href: '#callback-url' }],
          formErrors: { callbackUrl: 'Callback URL must be approved. Please contact support' }
        })
      })
    })
  })
})
