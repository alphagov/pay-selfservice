const sinon = require('sinon')
const { NOT_STARTED, LIVE } = require('@models/go-live-stage')
const formatSimplifiedAccountPathsFor = require('../../../utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const { expect } = require('chai')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')

const LIVE_ACCOUNT_TYPE = 'live'
const TEST_ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const {
  next,
  nextRequest,
  call
} = new ControllerTestBuilder('@middleware/simplified-account/settings/default-view-decider.middleware')
  .withService({
    externalId: SERVICE_ID,
    currentGoLiveStage: NOT_STARTED
  })
  .withAccountType(TEST_ACCOUNT_TYPE)
  .build()

describe('Middleware: defaultViewDecider', () => {
  it('should select service name get controller for test account on service with no live account when user is an admin', () => {
    nextRequest({
      user: {
        isAdminUserForService: () => true
      }
    })
    assertServiceNameControllerIsSelected(TEST_ACCOUNT_TYPE)
  })

  it('should select email notifications get controller for test account on service with no live account when user is not an admin', () => {
    nextRequest({
      user: {
        isAdminUserForService: () => false
      }
    })
    assertEmailNotificationsControllerIsSelected(TEST_ACCOUNT_TYPE)
  })

  it('should select service name get controller for live account when user is an admin', () => {
    nextRequest({
      user: {
        isAdminUserForService: () => true
      },
      account: {
        type: LIVE_ACCOUNT_TYPE
      }
    })
    assertServiceNameControllerIsSelected(LIVE_ACCOUNT_TYPE)
  })

  it('should select email notifications get controller for live account when user is not an admin', () => {
    nextRequest({
      user: {
        isAdminUserForService: () => false
      },
      account: {
        type: LIVE_ACCOUNT_TYPE
      }
    })
    assertEmailNotificationsControllerIsSelected(LIVE_ACCOUNT_TYPE)
  })

  it('should select email notifications get controller for test account on service with live account when user is an admin', () => {
    nextRequest({
      user: {
        isAdminUserForService: () => true
      },
      account: {
        type: TEST_ACCOUNT_TYPE
      },
      service: {
        currentGoLiveStage: LIVE
      }
    })
    assertEmailNotificationsControllerIsSelected(TEST_ACCOUNT_TYPE)
  })

  it('should select email notifications get controller for test account on service with live account when user is not an admin', () => {
    nextRequest({
      user: {
        isAdminUserForService: () => false
      },
      account: {
        type: TEST_ACCOUNT_TYPE
      },
      service: {
        currentGoLiveStage: LIVE
      }
    })
    assertEmailNotificationsControllerIsSelected(TEST_ACCOUNT_TYPE)
  })
})

const assertEmailNotificationsControllerIsSelected = (accountType) => {
  const actual = call()
  const expectedUrl = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.emailNotifications.index, SERVICE_ID, accountType)
  const expectedController = 'getEmailNotificationsSettingsPage'
  expect(actual.req.url).to.equal(expectedUrl)
  expect(actual.req.selectedController.name).to.equal(expectedController)
  sinon.assert.called(next)
}

const assertServiceNameControllerIsSelected = (accountType) => {
  const actual = call()
  const expectedUrl = formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_ID, accountType)
  const expectedController = 'get'
  expect(actual.req.url).to.equal(expectedUrl)
  expect(actual.req.selectedController.name).to.equal(expectedController)
  sinon.assert.called(next)
}
