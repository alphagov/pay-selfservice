'use strict'

const sinon = require('sinon')
const { expect } = require('chai')

const rootController = require('../../../../app/controllers/root/index.controller')

let req, res
describe('Root controller', () => {
  beforeEach(function () {
    req = {}
    res = {
      redirect: sinon.spy()
    }
  })
  it('should redirect to My services page when ENABLE_MY_SERVICES_AS_DEFAULT_VIEW flag is enabled', () => {
    process.env.ENABLE_MY_SERVICES_AS_DEFAULT_VIEW = 'true'
    rootController.get(req, res)

    expect(res.redirect.calledWith('/my-services')).to.equal(true)
  })

  it('should redirect to account dashboard when ENABLE_MY_SERVICES_AS_DEFAULT_VIEW flag is not enabled', () => {
    process.env.ENABLE_MY_SERVICES_AS_DEFAULT_VIEW = 'false'
    req.account = { external_id: 'account-external-id' }
    rootController.get(req, res)

    expect(res.redirect.calledWith('/account/account-external-id/dashboard')).to.equal(true)
  })
})
