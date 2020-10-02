'use strict'

const assert = require('assert')

const sinon = require('sinon')

const loginController = require('../../../app/controllers/login')

// Global setup
let req, res, destroy, redirect

describe('Log out', () => {
  beforeEach(() => {
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

  afterEach(() => {
    destroy.restore()
    redirect.restore()
  })

  it('should clear the session', () => {
    loginController.logout(req, res)

    assert(destroy.calledOnce)
    assert(redirect.calledWith('/login'))
  })

  it('should handle no session gracefully', () => {
    req = {}

    loginController.logout(req, res)
    assert(redirect.calledWith('/login'))
  })
})

describe('Direct login after register', () => {
  it('should populate user request Id in register_invite cookie', () => {
    let req = {
      register_invite: {}
    }

    let user = {
      externalId: 'hd329chjqkdna89'
    }

    loginController.setupDirectLoginAfterRegister(req, res, user.externalId)
    assert.deepStrictEqual(req.register_invite.userExternalId, user.externalId)
  })

  it('should redirect to login', () => {
    let res = {
      redirect: () => {
      }
    }
    let req = {
      correlationId: 'correlationid'
    }

    redirect = sinon.spy(res, 'redirect')

    loginController.setupDirectLoginAfterRegister(req, res, null)
    assert(redirect.calledWith(303))
  })
})
