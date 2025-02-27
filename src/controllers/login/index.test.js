'use strict'

const assert = require('assert')

const sinon = require('sinon')

const loginController = require('./index')

// Global setup
let req, res, destroy, redirect

describe('Log out', function () {
  beforeEach(function () {
    req = {
      session: {
        destroy: () => {
        }
      }
    }
    res = {
      redirect: () => {
      }
    }

    destroy = sinon.spy(req.session, 'destroy')
    redirect = sinon.spy(res, 'redirect')
  })

  afterEach(function () {
    destroy.restore()
    redirect.restore()
  })

  it('should clear the session', function () {
    loginController.logout(req, res)

    assert(destroy.calledOnce)
    assert(redirect.calledWith('/login'))
  })

  it('should handle no session gracefully', function () {
    req = {}

    loginController.logout(req, res)
    assert(redirect.calledWith('/login'))
  })
})

describe('Direct login after register', function () {
  it('should populate user request Id in register_invite cookie', function () {
    const req = {
      register_invite: {}
    }

    const user = {
      externalId: 'hd329chjqkdna89'
    }

    loginController.setupDirectLoginAfterRegister(req, res, user.externalId)
    assert.deepStrictEqual(req.register_invite.userExternalId, user.externalId)
  })

  it('should redirect to login', function () {
    const res = {
      redirect: () => {
      }
    }
    const req = {}

    redirect = sinon.spy(res, 'redirect')

    loginController.setupDirectLoginAfterRegister(req, res, null)
    assert(redirect.calledWith(303))
  })
})
