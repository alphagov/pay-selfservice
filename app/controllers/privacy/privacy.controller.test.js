'use strict'

const sinon = require('sinon')

const privacyController = require('./privacy.controller')

let req, res
describe('Privacy controller', () => {
  beforeEach(function () {
    req = {}
    res = {
      render: sinon.spy()
    }
  })
  it('should redirect to Privacy page', () => {
    privacyController.getPage(req, res)
    sinon.assert.calledWith(res.render, 'privacy/privacy')
  })
})
