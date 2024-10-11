const { expect } = require('chai')
const { LIVE, NOT_STARTED } = require('../../../models/go-live-stage')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')

const LIVE_ACCOUNT_TYPE = 'live'
const TEST_ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

let req, res, indexController

const getController = () => {
  return proxyquire('./index.controller', {})
}

describe('Controller: settings/index', () => {
  describe('get', () => {
    beforeEach(() => {
      indexController = getController()
      res = {
        redirect: sinon.spy()
      }
      req = {
        account: {
          service_id: SERVICE_ID,
          type: TEST_ACCOUNT_TYPE
        },
        service: {
          currentGoLiveStage: NOT_STARTED
        }
      }
    })

    it('should redirect to service name index for test account on service with no live account', () => {
      indexController.get(req, res)
      expect(res.redirect.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_ID, TEST_ACCOUNT_TYPE))).to.be.true // eslint-disable-line
    })

    it('should redirect to service name index for live account', () => {
      req.account.type = 'live'
      indexController.get(req, res)
      expect(res.redirect.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_ID, LIVE_ACCOUNT_TYPE))).to.be.true // eslint-disable-line
    })

    it('should redirect to email notifications index for test account on service with live account', () => {
      req.service.currentGoLiveStage = LIVE
      indexController.get(req, res)
      expect(res.redirect.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, SERVICE_ID, TEST_ACCOUNT_TYPE))).to.be.true // eslint-disable-line
    })
  })
})
