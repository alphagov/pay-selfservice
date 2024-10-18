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
        user: {
          isAdminUserForService: () => false
        },
        account: {
          type: TEST_ACCOUNT_TYPE
        },
        service: {
          externalId: SERVICE_ID,
          currentGoLiveStage: NOT_STARTED
        }
      }
    })

    it('should redirect to service name index for test account on service with no live account when user is an admin', () => {
      req.user.isAdminUserForService = () => true
      indexController.get(req, res)
      const actual = res.redirect.getCall(0).args[0]
      const expected = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_ID, TEST_ACCOUNT_TYPE)
      expect(actual).to.equal(expected)
    })

    it('should redirect to email notifications index for test account on service with no live account when user is not an admin', () => {
      indexController.get(req, res)
      const actual = res.redirect.getCall(0).args[0]
      const expected = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, SERVICE_ID, TEST_ACCOUNT_TYPE)
      expect(actual).to.equal(expected)
    })

    it('should redirect to service name index for live account when user is an admin', () => {
      req.user.isAdminUserForService = () => true
      req.account.type = LIVE_ACCOUNT_TYPE
      indexController.get(req, res)
      const actual = res.redirect.getCall(0).args[0]
      const expected = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_ID, LIVE_ACCOUNT_TYPE)
      expect(actual).to.equal(expected)
    })

    it('should redirect to email notifications index for live account when user is not an admin', () => {
      req.account.type = LIVE_ACCOUNT_TYPE
      indexController.get(req, res)
      const actual = res.redirect.getCall(0).args[0]
      const expected = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, SERVICE_ID, LIVE_ACCOUNT_TYPE)
      expect(actual).to.equal(expected)
    })

    it('should redirect to email notifications index for test account on service with live account when user is an admin', () => {
      req.user.isAdminUserForService = () => true
      req.service.currentGoLiveStage = LIVE
      indexController.get(req, res)
      const actual = res.redirect.getCall(0).args[0]
      const expected = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, SERVICE_ID, TEST_ACCOUNT_TYPE)
      expect(actual).to.equal(expected)
    })

    it('should redirect to email notifications index for test account on service with live account when user is not an admin', () => {
      req.service.currentGoLiveStage = LIVE
      indexController.get(req, res)
      const actual = res.redirect.getCall(0).args[0]
      const expected = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, SERVICE_ID, TEST_ACCOUNT_TYPE)
      expect(actual).to.equal(expected)
    })
  })
})
