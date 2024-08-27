'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const paths = require('../../paths')
const mockResponses = {}
const mockServiceService = {}
const mockUserService = {}

const SERVICE_NAME = 'A brand spanking new service name'
const WELSH_SERVICE_NAME = 'Some Cymraeg new service name'

let req, res, next

const getController = function (mockResponses, mockServiceService, mockUserService) {
  return proxyquire('./create-service.controller', {
    '../../utils/response': mockResponses,
    '../../services/service.service': mockServiceService,
    '../../services/user.service': mockUserService
  })
}

function initialiseSpies () {
  res = {
    redirect: sinon.spy()
  }
  next = sinon.spy()
  mockResponses.response = sinon.spy()
}

describe('Controller: createService, Method: post', () => {
  describe('when organisation type is provided', () => {
    mockServiceService.createService = sinon.stub().resolves({
      service: {
        externalId: 'def456'
      },
      externalAccountId: 'abc123'
    })
    mockUserService.assignServiceRole = sinon.stub().resolves()

    before(async () => {
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        session: {
          pageData: {
            createService: {
              current_name: SERVICE_NAME,
              current_name_cy: WELSH_SERVICE_NAME,
              service_selected_cy: true
            }
          }
        },
        body: {
          'select-org-type': 'central'
        },
        flash: sinon.spy()
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should redirect to newly created service dashboard`, () => {
      sinon.assert.calledWith(mockServiceService.createService, SERVICE_NAME, WELSH_SERVICE_NAME, 'central')
      sinon.assert.calledWith(mockUserService.assignServiceRole, '38475y38q4758ow4', 'def456', 'admin')
      sinon.assert.calledWith(req.flash, 'messages', { state: 'success', icon: '&check;', content: 'We\'ve created your service.' })
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0][0]).to.equal(formatAccountPathsFor(paths.account.dashboard.index, 'abc123'))
    })
  })

  describe('when organisation type is provided, but create service fails', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().rejects(new Error('something went wrong'))
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        session: {
          pageData: {
            createService: {
              current_name: SERVICE_NAME,
              current_name_cy: WELSH_SERVICE_NAME,
              service_selected_cy: true
            }
          }
        },
        body: {
          'select-org-type': 'central'
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'responses.renderErrorView' with req, res and the error received from the client`, () => {
      sinon.assert.calledOnce(next)
      expect(next.firstCall.args[0]).to.be.instanceOf(Error)
    })
  })

  describe('when organisation type is provided, and the create service succeeds, but the assign service role call fails', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().resolves({
        service: {
          externalId: 'def456'
        },
        externalAccountId: 'abc123'
      })
      mockUserService.assignServiceRole = sinon.stub().rejects(new Error('something went wrong'))
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        session: {
          pageData: {
            createService: {
              current_name: SERVICE_NAME,
              current_name_cy: WELSH_SERVICE_NAME,
              service_selected_cy: true
            }
          }
        },
        body: {
          'select-org-type': 'central'
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'responses.renderErrorView' with req, res and the error received from the client`, () => {
      sinon.assert.calledOnce(next)
      expect(next.firstCall.args[0]).to.be.instanceOf(Error)
    })
  })

  describe('when organisation type is not provided', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub()
      mockUserService.assignServiceRole = sinon.stub()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        session: {
          pageData: {
            createService: {
              current_name: SERVICE_NAME,
              current_name_cy: WELSH_SERVICE_NAME,
              service_selected_cy: true
            }
          }
        },
        body: {}
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it('should redirect back to select org type', () => {
      sinon.assert.calledWith(res.redirect, paths.serviceSwitcher.create.selectOrgType)
    })

    it('should set error information on the session', () => {
      expect(req.session.pageData.createService).to.have.property('current_name').to.equal(SERVICE_NAME)
      expect(req.session.pageData.createService).to.have.property('current_name_cy').to.equal(WELSH_SERVICE_NAME)
      expect(req.session.pageData.createService).to.have.property('service_selected_cy').to.equal(true)
      expect(req.session.pageData.createService).to.have.property('errors').to.deep.equal({ organisation_type: 'Organisation type is required' })
    })
  })
})
