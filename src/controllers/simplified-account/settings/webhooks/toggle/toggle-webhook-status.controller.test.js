const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { Webhook, WebhookStatus } = require('@models/webhooks/Webhook.class')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const GATEWAY_ACCOUNT_ID = '100'

const testWebhook = new Webhook()
  .withCallbackUrl('https://www.globexcorporation.example.com')
  .withStatus(WebhookStatus.INACTIVE)
  .withDescription('My webhook')
const mockResponse = sinon.spy()
const mockToggleWebhookStatus = sinon.stub().resolves({})
const mockGetWebhook = sinon.stub().resolves(testWebhook)

const { req, res, call, nextRequest } = new ControllerTestBuilder('@controllers/simplified-account/settings/webhooks/toggle/toggle-webhook-status.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: ACCOUNT_TYPE
  })
  .withParams({ webhookExternalId: 'webhook-external-id' })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/webhooks.service': { toggleStatus: mockToggleWebhookStatus, getWebhook: mockGetWebhook }
  })
  .build()

describe('Controller: settings/webhooks/update', () => {
  beforeEach(() => {
    mockGetWebhook.returns(testWebhook)
  })

  describe('get', () => {
    before(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      mockResponse.should.have.been.calledOnce
    })

    it('should pass req, res and template path to the response method', () => {
      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/webhooks/toggle-status')
    })

    it('should pass context data to the response method', () => {
      mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        webhook: testWebhook,
        backLink: '/service/service-id-123abc/account/test/settings/webhooks/webhook-external-id'
      })
    })

    it('should call the webhooks service to find the webhook', () => {
      mockGetWebhook.should.have.been.calledOnce
      mockGetWebhook.should.have.been.calledWith('webhook-external-id', SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_ID)
    })
  })

  describe('post', () => {
    describe('when no option is selected', () => {
      before(async () => {
        nextRequest({
          body: {
            toggleActive: ''
          }
        })
        await call('post')
      })

      it('should call the response method with validation errors', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          errors: {
            summary: [
              { text: 'Confirm if you want to activate My webhook', href: '#toggle-active' }
            ],
            formErrors: { toggleActive: 'Confirm if you want to activate My webhook' }
          },
          webhook: testWebhook,
          backLink: '/service/service-id-123abc/account/test/settings/webhooks/webhook-external-id'
        })
      })
    })

    describe('when "yes" is selected', () => {
      before(async () => {
        nextRequest({
          body: {
            toggleActive: 'yes'
          }
        })
        await call('post')
      })

      it('should call the webhooks service to update the webhook status', () => {
        mockToggleWebhookStatus.should.have.been.calledOnce
        mockToggleWebhookStatus.should.have.been.calledWith('webhook-external-id', SERVICE_EXTERNAL_ID, GATEWAY_ACCOUNT_ID)
      })

      it('should set success message', () => {
        sinon.assert.calledOnceWithExactly(req.flash,
          'messages', {
            state: 'success',
            icon: '&check;',
            heading: 'My webhook updated to active'
          }
        )
      })

      it('should redirect to the webhook detail page', () => {
        res.redirect.should.have.been.calledOnce
        res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'webhook-external-id'))
      })
    })

    describe('when "no" is selected', () => {
      before(async () => {
        nextRequest({
          body: {
            toggleActive: 'no'
          }
        })
        await call('post')
      })

      it('should not call the webhooks service to update the webhook status', () => {
        mockToggleWebhookStatus.should.not.have.been.called
      })

      it('should redirect to the webhook detail page', () => {
        res.redirect.should.have.been.calledOnce
        res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.webhooks.detail, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'webhook-external-id'))
      })
    })
  })
})
