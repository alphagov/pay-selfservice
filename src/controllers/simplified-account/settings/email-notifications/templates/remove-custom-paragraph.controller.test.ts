import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import { expect } from 'chai'

const ACCOUNT_TYPE = 'test'
const ACCOUNT_ID = '1337'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const SERVICE_NAME = 'My Service'

const mockResponse = sinon.stub()
const updateCustomParagraphStub = sinon.stub().resolves()

const { res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/email-notifications/templates/remove-custom-paragraph.controller'
)
  .withService({
    externalId: SERVICE_EXTERNAL_ID,
    name: SERVICE_NAME,
  })
  .withAccount({
    type: ACCOUNT_TYPE,
    id: ACCOUNT_ID,
    emailCollectionMode: 'MANDATORY',
    emailNotifications: {
      paymentConfirmed: {
        enabled: true,
        templateBody: 'Do this next',
      },
    },
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/email.service': { updateCustomParagraphByServiceIdAndAccountType: updateCustomParagraphStub },
  })
  .build()

describe('post', () => {
  it('should update the confirmation template', async () => {
    await call('post')

    expect(updateCustomParagraphStub.calledOnce).to.be.true
    expect(updateCustomParagraphStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, '')).to.be.true
  })

  it('should redirect to the templates page', async () => {
    await call('post')

    expect(res.redirect.calledOnce).to.be.true
    expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
  })
})
