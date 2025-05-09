const sinon = require('sinon')
const User = require('../../../../../models/User.class')
const { expect } = require('chai')
const paths = require('../../../../../paths')
const proxyquire = require('proxyquire')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')
const Service = require('@models/Service.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

let req, res, responseStub, refundEmailsController, setRefundEmailEnabledByServiceIdAndAccountTypeStub

const getController = (stubs = {}) => {
  return proxyquire('./refund-emails.controller', {
    '../../../../../utils/response': { response: stubs.response },
    '../../../../../services/email.service': { setRefundEmailEnabledByServiceIdAndAccountType: stubs.setRefundEmailEnabledByServiceIdAndAccountType }
  })
}

const setupTest = (additionalReqProps = {}) => {
  responseStub = sinon.spy()
  setRefundEmailEnabledByServiceIdAndAccountTypeStub = sinon.stub().resolves({ status: 200 })
  refundEmailsController = getController({
    response: responseStub,
    setRefundEmailEnabledByServiceIdAndAccountType: setRefundEmailEnabledByServiceIdAndAccountTypeStub
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    flash: sinon.stub(),
    account: {
      type: ACCOUNT_TYPE,
      rawResponse: {
        email_collection_mode: 'MANDATORY',
        email_notifications: {
          REFUND_ISSUED: {
            enabled: true
          }
        }
      }
    },
    service: new Service(validServiceResponse({
      external_id: SERVICE_EXTERNAL_ID
    })),
    user: new User({
      service_roles: [
        {
          role: {
            name: 'admin'
          },
          service: validServiceResponse({
            external_id: SERVICE_EXTERNAL_ID
          }),
        }
      ]
    }),
    ...additionalReqProps
  }
}

describe('Controller: settings/email-notifications/refund-emails', () => {
  describe('get', () => {
    before(() => {
      setupTest()
      refundEmailsController.get(req, res)
    })

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/email-notifications/refund-email-toggle')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('refundEmailEnabled').to.equal(true)
      expect(responseStub.args[0][3]).to.have.property('emailCollectionMode').to.equal('MANDATORY')
      expect(responseStub.args[0][3]).to.have.property('backLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })

  describe('post', () => {
    before(() => {
      setupTest({
        body: {
          refundEmailToggle: 'false'
        }
      })
      refundEmailsController.post(req, res)
    })

    it('should update refund email enabled', () => {
      expect(setRefundEmailEnabledByServiceIdAndAccountTypeStub.calledOnce).to.be.true
      expect(setRefundEmailEnabledByServiceIdAndAccountTypeStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'false')).to.be.true
    })

    it('should redirect to the email notifications landing page', () => {
      expect(res.redirect.calledOnce).to.be.true
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })
})
