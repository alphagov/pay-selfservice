const path = require('path')
const sinon = require('sinon')
const loginController = require(path.join(__dirname, '/../../../app/controllers/login_controller.js'))

const assert = require('assert')
let req
let res
let destroy
let redirect

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
    loginController.logOut(req, res)

    assert(destroy.calledOnce)
    assert(redirect.calledWith('/login'))
  })

  it('should handle no session gracefully', function () {
    req = {}

    loginController.logOut(req, res)
    assert(redirect.calledWith('/login'))
  })
})

describe('Direct login after register', function () {
  it('should populate user request Id in register_invite cookie', function () {
    let req = {
      register_invite: {}
    }

    let user = {
      externalId: 'hd329chjqkdna89'
    }

    loginController.setupDirectLoginAfterRegister(req, res, user)
    assert.deepEqual(req.register_invite.userExternalId, user.externalId)
  })

  it('should redirect to login', function () {
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
