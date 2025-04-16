const sinon = require('sinon')
const User = require('../../../../../models/User.class')
const { expect } = require('chai')
const paths = require('../../../../../paths')
const proxyquire = require('proxyquire')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')
const Service = require('@models/Service.class')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const SERVICE_NAME = 'My Service'

let req, res, responseStub, customParagraphController, updateCustomParagraphByServiceIdAndAccountTypeStub

const getController = (stubs = {}) => {
  return proxyquire('./custom-paragraph.controller', {
    '@utils/response': { response: stubs.response },
    '@services/email.service': { updateCustomParagraphByServiceIdAndAccountType: stubs.updateCustomParagraphByServiceIdAndAccountType }
  })
}

const setupTest = (body = {}) => {
  responseStub = sinon.spy()
  updateCustomParagraphByServiceIdAndAccountTypeStub = sinon.stub().resolves({ status: 200 })
  customParagraphController = getController({
    response: responseStub,
    updateCustomParagraphByServiceIdAndAccountType: updateCustomParagraphByServiceIdAndAccountTypeStub
  })
  res = {
    redirect: sinon.spy()
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
            template_body: 'Do this next'
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

describe('Controller: settings/email-notifications/templates/custom-paragraph', () => {
  describe('get', () => {
    before(() => {
      setupTest()
      customParagraphController.get(req, res)
    })

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/email-notifications/custom-paragraph')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('customParagraph').to.equal('Do this next')
      expect(responseStub.args[0][3]).to.have.property('serviceName').to.equal(SERVICE_NAME)
      expect(responseStub.args[0][3]).to.have.property('backLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })

  describe('postRemoveCustomParagraph', () => {
    before(() => {
      const body = { customParagraph: 'a test custom paragraph' }
      setupTest(body)
      customParagraphController.postRemoveCustomParagraph(req, res)
    })

    it('should update the confirmation template', () => {
      expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledOnce).to.be.true // eslint-disable-line
      expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, '')).to.be.true // eslint-disable-line
    })

    it('should redirect to the templates page', () => {
      expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
    })
  })

  describe('postEditCustomParagraph', () => {
    describe('with empty body', () => {
      before(() => {
        const body = { customParagraph: '' }
        setupTest(body)
        customParagraphController.postEditCustomParagraph(req, res)
      })
      it('should update the confirmation template', () => {
        expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledOnce).to.be.true // eslint-disable-line
        expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, '')).to.be.true // eslint-disable-line
      })

      it('should not set success message', () => {
        sinon.assert.notCalled(req.flash)
      })

      it('should redirect to the templates page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
      })
    })
    describe('without validation error', () => {
      before(() => {
        const body = { customParagraph: 'a test custom paragraph' }
        setupTest(body)
        customParagraphController.postEditCustomParagraph(req, res)
      })
      it('should update the confirmation template', () => {
        expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledOnce).to.be.true // eslint-disable-line
        expect(updateCustomParagraphByServiceIdAndAccountTypeStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'a test custom paragraph')).to.be.true // eslint-disable-line
      })

      it('should set success message', () => {
        sinon.assert.calledOnceWithExactly(req.flash,
          'messages', {
            state: 'success',
            icon: '&check;',
            heading: 'Custom paragraph updated'
          }
        )
      })

      it('should redirect to the templates page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.templates)
      })
    })

    describe('with validation error', () => {
      const invalidText = 'hi'.repeat(5000)
      before(() => {
        const body = { customParagraph: invalidText }
        setupTest(body)
        customParagraphController.postEditCustomParagraph(req, res)
      })

      it('should call the response method', () => {
        expect(responseStub.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0]).to.include('simplified-account/settings/email-notifications/custom-paragraph')
      })

      it('should pass context data to the response method', () => {
        const errors = responseStub.args[0][3].errors
        expect(errors.summary).to.deep.equal(
          [
            {
              text: 'Custom paragraph name must be 5000 characters or fewer',
              href: '#custom-paragraph'
            }
          ])
        expect(errors.formErrors).to.deep.equal(
          {
            customParagraph: 'Custom paragraph name must be 5000 characters or fewer'
          }
        )
        expect(responseStub.args[0][3]).to.have.property('customParagraph').to.equal(invalidText)
        expect(responseStub.args[0][3]).to.have.property('serviceName').to.equal(SERVICE_NAME)
        expect(responseStub.args[0][3]).to.have.property('backLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
        expect(responseStub.args[0][3]).to.have.property('removeCustomParagraphLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.removeCustomParagraph)
      })
    })
  })
})
