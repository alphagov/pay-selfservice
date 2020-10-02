'use strict'

const path = require('path')
const assert = require('assert')
const sinon = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

describe('retrieve email notification template', function () {
  const response = {
    status: () => {
    },
    render: () => {
    },
    setHeader: () => {
    }
  }
  let render
  let next

  beforeEach(function () {
    render = sinon.stub(response, 'render')
    next = sinon.spy()
  })

  afterEach(function () {
    render.restore()
  })

  it('should call the error view if connector call fails', function (done) {
    const retrieveEmailNotification = require(path.join(__dirname, '/../../../app/middleware/get-email-notification.js'))
    const req = { account: { gateway_account_id: 1 }, headers: {} }
    retrieveEmailNotification(req, response, next)
    setTimeout(function () {
      expect(next.notCalled).to.be.true // eslint-disable-line
      assert(render.calledWith('error', { message: 'There is a problem with the payments platform' }))
      done()
    }, 100)
  })

  it('should merge account with email notification template data and call next on success', function () {
    const emailStub = {
      getEmailSettings: function () {
        return Promise.resolve({ customEmailText: 'hello', emailEnabled: true })
      }
    }
    const retrieveEmailNotification = proxyquire(path.join(__dirname, '/../../../app/middleware/get-email-notification.js'), {
      '../services/email.service.js': emailStub
    })
    const req = { account: { gateway_account_id: 1 }, headers: {} }
    return retrieveEmailNotification(req, response, next).then(function () {
      expect(req.account).to.deep.equal({
        customEmailText: 'hello',
        'gateway_account_id': 1,
        'emailEnabled': true
      })
      expect(next.called).to.be.true // eslint-disable-line
    })
  })
})
