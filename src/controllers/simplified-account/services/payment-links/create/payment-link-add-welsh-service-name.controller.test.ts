import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import formatSimplifiedAccountPathsFor from '@utils/simplified-account/format/format-simplified-account-paths-for'
import { describe, it, beforeEach } from 'mocha'

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const EN_SERVICE_NAME = 'My Cool Service'
const CY_SERVICE_NAME = 'Fy Ngwasanaeth Cwl'

const mockResponse = sinon.stub()
const mockUpdateServiceName = sinon.stub()

const {
  res,
  call,
  nextRequest
} = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/payment-link-add-welsh-service-name.controller'
)
  .withService({
    id: '123',
    externalId: SERVICE_EXTERNAL_ID,
    serviceName: {
      en: EN_SERVICE_NAME,
      cy: CY_SERVICE_NAME
    }
  })
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/service.service': { updateServiceName: mockUpdateServiceName }
  })
  .build()

describe('Controller: add Welsh service name', () => {
  describe('get', () => {
    describe('when directed to enter a Welsh service name from payment link creation', () => {
      beforeEach(async () => {
        mockResponse.resetHistory()
        nextRequest({ query: { cy: 'true' } })
        await call('get')
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass template path to the response method', () => {
        const templatePath = mockResponse.args[0][2] as string
        sinon.assert.match(templatePath, 'simplified-account/services/payment-links/create/add-welsh-service-name')
      })

      it('should set context data for Welsh editing', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.serviceName, CY_SERVICE_NAME)
        sinon.assert.match(context.backLink, formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ))
        sinon.assert.match(context.submitLink, formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.addWelshServiceName,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ))
        sinon.assert.match(context.createWelshPaymentLinkLinkWithEnglishServiceName, formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.create,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
          )+ '?language=cy&useEnglishServiceName=true',
        )
      })
    })
  })

  describe('post', () => {
    describe('when entering a valid Welsh service name', () => {
      beforeEach(async () => {
        mockUpdateServiceName.resetHistory()
        res.redirect.resetHistory?.()
        nextRequest({
          body: { serviceName: 'New Welsh Name' }
        })
        await call('post')
      })

      it('should update the service name', () => {
        sinon.assert.calledOnce(mockUpdateServiceName)
        sinon.assert.calledWith(
          mockUpdateServiceName,
          SERVICE_EXTERNAL_ID,
          EN_SERVICE_NAME,
          'New Welsh Name'
        )
      })

      it('should redirect to the Welsh payment link creation page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(
          res.redirect,
          formatSimplifiedAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.create + "?language=cy",
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          )
        )
      })
    })

    describe('when submitting an invalid service name', () => {
      const longName =
          'this is a really really really long service name that is longer than fifty characters'
      beforeEach(async () => {
        mockUpdateServiceName.resetHistory()
        mockResponse.resetHistory()
        nextRequest({
          body: {
            serviceName: longName,
            cy: 'false'
          }
        })
        await call('post')
      })

      it('should not update the service name', () => {
        sinon.assert.notCalled(mockUpdateServiceName)
      })

      it('should render the edit page with errors', () => {
        sinon.assert.calledOnce(mockResponse)

        const templatePath = mockResponse.args[0][2] as string
        sinon.assert.match(templatePath, 'simplified-account/services/payment-links/create/add-welsh-service-name')
      })

      it('should set error context data', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.serviceName, longName)

        const errors = context.errors as Record<string, unknown>
        sinon.assert.match(errors.summary, sinon.match.array)
        sinon.assert.match(errors.formErrors, sinon.match.object)

        sinon.assert.match(context.backLink, formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.index,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ))
        sinon.assert.match(context.submitLink, formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.addWelshServiceName,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
        ))
        sinon.assert.match(context.createWelshPaymentLinkLinkWithEnglishServiceName, formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.create,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE
          )+ '?language=cy&useEnglishServiceName=true',
        )
      })
    })
  })
})
