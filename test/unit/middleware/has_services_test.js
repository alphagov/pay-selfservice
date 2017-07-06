const path = require('path')
const assert = require('assert')
const sinon = require('sinon')
const nock = require('nock')
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const hasServices = require(path.join(__dirname, '/../../../app/middleware/has_services.js'))

chai.use(chaiAsPromised)

describe('user has services middleware', function () {
  const response = {
    status: () => {},
    render: () => {},
    setHeader: () => {}
  }
  let render, status, next

  beforeEach(function () {
    render = sinon.stub(response, 'render')
    status = sinon.stub(response, 'status')
    next = sinon.spy()
    nock.cleanAll()
  })

  afterEach(function () {
    render.restore()
    status.restore()
  })

  it('should call next when user has services', function (done) {
    const req = {user: {services: ['1'], external_id: 'external-id'}, headers: {}}

    hasServices(req, response, next)

    expect(next.called).to.be.true  // eslint-disable-line

    done()
  })

  it('should show error view when user does not have services', function (done) {
    const req = {user: {services: []}, headers: {}}

    hasServices(req, response, next)

    expect(next.notCalled).to.be.true  // eslint-disable-line
    assert(render.calledWith('error', {message: 'This user does not belong to any service. Ask your service administrator to invite you to GOV.UK Pay.'}))
    assert(status.calledWith(200))

    done()
  })
})
