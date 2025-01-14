'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

let req, res, sessionValidatorMock

describe('Privacy controller', () => {
  beforeEach(function () {
    req = {}
    res = {
      render: sinon.spy()
    }
  })

  describe('Logged out user', () => {
    it('should redirect to Privacy page and set flags correctly', () => {
      req = {
        user: { externalId: 'some-id' },
        session: {}
      }

      sessionValidatorMock = {
        validate: () => false
      }

      const controller = getControllerWithMock(sessionValidatorMock)

      controller.getPage(req, res)

      sinon.assert.calledWith(res.render, 'privacy/privacy', sinon.match({
        loggedIn: false,
        hideServiceNav: true
      }))
    })
  })

  describe('Logged in user', () => {
    it('should redirect to Privacy page and set flags correctly', () => {
      sessionValidatorMock = {
        validate: () => true
      }

      const controller = getControllerWithMock(sessionValidatorMock)

      controller.getPage(req, res)

      sinon.assert.calledWith(res.render, 'privacy/privacy', sinon.match({
        loggedIn: true,
        hideServiceNav: true
      }))
    })
  })
})

const getControllerWithMock = function getController (sessionValidatorMock) {
  return proxyquire('./privacy.controller', {
    './../../services/session-validator': sessionValidatorMock
  })
}
