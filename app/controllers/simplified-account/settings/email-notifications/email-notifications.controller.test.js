const { expect } = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const User = require('../../../../models/User.class')
const paths = require('../../../../paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, responseStub, emailNotificationsController, setEmailCollectionModeByServiceIdAndAccountTypeStub

const getController = (stubs = {}) => {
  return proxyquire('./email-notifications.controller', {
    '../../../../utils/response': { response: stubs.response },
    '../../../../services/email.service': { setEmailCollectionModeByServiceIdAndAccountType: stubs.setEmailCollectionModeByServiceIdAndAccountType }
  })
}

const setupTest = (additionalReqProps = {}) => {
  responseStub = sinon.spy()
  setEmailCollectionModeByServiceIdAndAccountTypeStub = sinon.stub().resolves({ status: 200 })
  emailNotificationsController = getController({
    response: responseStub,
    setEmailCollectionModeByServiceIdAndAccountType: setEmailCollectionModeByServiceIdAndAccountTypeStub
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    flash: sinon.stub(),
    account: {
      type: ACCOUNT_TYPE,
      email_collection_mode: 'MANDATORY',
      email_notifications: {
        PAYMENT_CONFIRMED: {
          enabled: true
        },
        REFUND_ISSUED: {
          enabled: true
        }
      }
    },
    service: {
      externalId: SERVICE_ID
    },
    user: new User({
      service_roles: [
        {
          role: {
            name: 'admin'
          },
          service: {
            external_id: SERVICE_ID
          }
        }
      ]
    }),
    ...additionalReqProps
  }
}

describe('Controller: settings/email-notifications', () => {
  describe('getEmailNotificationsSettingsPage', () => {
    before(() => {
      setupTest()
      emailNotificationsController.getEmailNotificationsSettingsPage(req, res)
    })

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/email-notifications/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('emailCollectionMode').to.equal('On (mandatory)')
      expect(responseStub.args[0][3]).to.have.property('confirmationEmailEnabled').to.equal(true)
      expect(responseStub.args[0][3]).to.have.property('refundEmailEnabled').to.equal(true)
      expect(responseStub.args[0][3]).to.have.property('isServiceAdmin').to.equal(true)
    })
  })

  describe('getCollectEmailPage', () => {
    before(() => {
      setupTest()
      emailNotificationsController.getCollectEmailPage(req, res)
    })

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/email-notifications/edit-email-collection-mode')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('emailCollectionModes')
      expect(responseStub.args[0][3].emailCollectionModes).to.deep.equal({
        mandatory: 'MANDATORY',
        optional: 'OPTIONAL',
        no: 'OFF'
      })
      expect(responseStub.args[0][3]).to.have.property('emailCollectionMode').to.equal('MANDATORY')
      expect(responseStub.args[0][3]).to.have.property('backLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })

  describe('editCollectEmail', () => {
    before(() => {
      setupTest({
        body: {
          'email-collection-mode': 'OPTIONAL'
        }
      })
      emailNotificationsController.editCollectEmail(req, res)
    })

    it('should update the email collection mode', () => {
      expect(setEmailCollectionModeByServiceIdAndAccountTypeStub.calledOnce).to.be.true // eslint-disable-line
      expect(setEmailCollectionModeByServiceIdAndAccountTypeStub.calledWith(SERVICE_ID, ACCOUNT_TYPE, 'OPTIONAL')).to.be.true // eslint-disable-line
    })

    it('should redirect to the email notifications landing page', () => {
      expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })
})
