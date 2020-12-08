'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const errorHandler = require('../../../app/middleware/error-handler')
const { NotAuthenticatedError, UserAccountDisabledError, NotAuthorisedError } = require('../../../app/errors')
const paths = require('../../../app/paths')

const req = {
  headers: {
    'x-request-id': 'a-request-id'
  },
  session: {}
}
let res, next

describe('Error handler middleware', () => {
  beforeEach(() => {
    next = sinon.spy()
    res = {
      headersSent: false,
      status: sinon.spy(),
      render: sinon.spy(),
      redirect: sinon.spy(),
      setHeader: sinon.stub()
    }
  })

  it('should pass error to next when headers have already been set on the response', () => {
    res.headersSent = true
    const err = new Error('some error')
    errorHandler(err, req, res, next)
    sinon.assert.calledWith(next, err)
  })

  it('should redirect to login page if error is NotAuthenticatedError', () => {
    req.originalUrl = '/some/url'
    const err = new NotAuthenticatedError('user is not logged in')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.redirect)
    sinon.assert.calledWith(res.redirect, paths.user.logIn)
    expect(req.session.last_url).to.equal(req.originalUrl)
  })

  it('should render no access page if error is UserAccountDisabledError', () => {
    const err = new UserAccountDisabledError('user account is disabled')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 401)
    sinon.assert.calledOnce(res.render)
    sinon.assert.calledWith(res.render, 'login/noaccess')
  })

  it('should render error page with status code 403 if error is NotAuthorisedError', () => {
    const err = new NotAuthorisedError('user does not have permission')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 403)
    sinon.assert.calledOnce(res.render)
    sinon.assert.calledWith(res.render, 'error')
  })

  it('should render error page with status code 500 if error is general handled error', () => {
    const err = new Error('something went wrong')
    errorHandler(err, req, res, null)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledOnce(res.render)
    sinon.assert.calledWith(res.render, 'error')
  })
})
