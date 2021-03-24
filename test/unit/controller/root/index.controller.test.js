'use strict'

const sinon = require('sinon')

const rootController = require('../../../../app/controllers/root/index.controller')

let req, res
describe('Root controller', () => {
  beforeEach(function () {
    req = {}
    res = {
      redirect: sinon.spy()
    }
  })
  it('should redirect to My services page', () => {
    rootController.get(req, res)
    sinon.assert.calledWith(res.redirect, '/my-services')
  })
})
