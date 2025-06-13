const sinon = require('sinon')
const User = require('@models/user/User.class')
const { expect } = require('chai')
const paths = require('../../../../../paths')
const proxyquire = require('proxyquire')
const Service = require('@models/service/Service.class')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const SERVICE_NAME = 'My Service'

let req, res, responseStub, templatesController

const getController = (stubs = {}) => {
  return proxyquire('./templates.controller', {
    '../../../../../utils/response': { response: stubs.response }
  })
}

const setupTest = () => {
  responseStub = sinon.spy()
  templatesController = getController({
    response: responseStub
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
          PAYMENT_CONFIRMED: {
            enabled: true,
            template_body: null
          }
        }
      }
    },
    service: new Service(validServiceResponse({
      external_id: SERVICE_EXTERNAL_ID,
      name: SERVICE_NAME
    })),
    user: new User({
      service_roles: [
        {
          role: {
            name: 'admin'
          },
          service: validServiceResponse({
            external_id: SERVICE_EXTERNAL_ID,
            name: SERVICE_NAME
          })
        }
      ]
    })
  }
}

describe('Controller: settings/email-notifications/templates', () => {
  describe('get', () => {
    before(() => {
      setupTest()
      templatesController.get(req, res)
    })

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/email-notifications/templates')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('customEmailText').to.equal(null)
      expect(responseStub.args[0][3]).to.have.property('serviceName').to.equal(SERVICE_NAME)
      expect(responseStub.args[0][3]).to.have.property('backLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })
})
