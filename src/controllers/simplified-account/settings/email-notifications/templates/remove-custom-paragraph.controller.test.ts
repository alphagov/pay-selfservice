import { expect } from 'chai'
import sinon from 'sinon'
import Service from '@models/service/Service.class'
import { validServiceResponse } from '@test/fixtures/service.fixtures'
import User from '@models/user/User.class'
import proxyquire from 'proxyquire'

let req, res, responseStub, customParagraphController, updateCustomParagraphByServiceIdAndAccountTypeStub

const getController = (stubs = {}) => {
  return proxyquire('./custom-paragraph.controller', {
    '@utils/response': { response: stubs.response },
    '@services/email.service': {
      updateCustomParagraphByServiceIdAndAccountType: stubs.updateCustomParagraphByServiceIdAndAccountType,
    },
  })
}

const setupTest = (body = {}) => {
  responseStub = sinon.spy()
  updateCustomParagraphByServiceIdAndAccountTypeStub = sinon.stub().resolves({ status: 200 })
  customParagraphController = getController({
    response: responseStub,
    updateCustomParagraphByServiceIdAndAccountType: updateCustomParagraphByServiceIdAndAccountTypeStub,
  })
  res = {
    redirect: sinon.spy(),
  }
  req = {
    body,
    flash: sinon.stub(),
    account: {
      type: ACCOUNT_TYPE,
      rawResponse: {
        email_collection_mode: 'MANDATORY',
        email_notifications: {
          PAYMENT_CONFIRMED: {
            enabled: true,
            template_body: 'Do this next',
          },
        },
      },
    },
    service: new Service(
      validServiceResponse({
        external_id: SERVICE_EXTERNAL_ID,
        name: SERVICE_NAME,
      })
    ),
    user: new User({
      service_roles: [
        {
          role: {
            name: 'admin',
          },
          service: validServiceResponse({
            external_id: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME,
          }),
        },
      ],
    }),
  }
}

describe('postRemoveCustomParagraph', () => {
  beforeEach(async () => {
    const body = { customParagraph: 'a test custom paragraph' }
    setupTest(body)
    await customParagraphController.postRemoveCustomParagraph(req, res)
  })

  it('should update the confirmation template', () => {
    expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledOnce).to.be.true
    expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, '')).to.be
      .true
  })

  it('should redirect to the templates page', () => {
    expect(res.redirect.calledOnce).to.be.true
    expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
  })
})
