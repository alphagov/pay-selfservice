import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import { formatSimplifiedAccountPathsFor } from '@utils/simplified-account/format'
import paths from '@root/paths'
import { describe, it, beforeEach } from 'mocha'

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const EN_SERVICE_NAME = 'My Cool Service'
const CY_SERVICE_NAME = 'Fy Ngwasanaeth Cwl'

const mockResponse = sinon.stub()
const mockUpdateServiceName = sinon.stub()

const { res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/service-name/use-en/use-english-service-name.controller')
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

describe('Controller: use English service name', () => {
  beforeEach(async () => {
    mockUpdateServiceName.resetHistory()
    res.redirect.resetHistory?.()
    await call('post')
  })

  it('should update the Welsh service name with the English service name', () => {
    sinon.assert.calledOnce(mockUpdateServiceName)
    sinon.assert.calledWith(
      mockUpdateServiceName,
      SERVICE_EXTERNAL_ID,
      EN_SERVICE_NAME,
      EN_SERVICE_NAME
    )
  })

  it('should redirect to the Welsh payment link creation page', () => {
    sinon.assert.calledOnce(res.redirect)
    sinon.assert.calledWith(res.redirect, formatSimplifiedAccountPathsFor(
      paths.simplifiedAccount.paymentLinks.create + '?language=cy',
      SERVICE_EXTERNAL_ID,
      ACCOUNT_TYPE
    ))
  })
})
