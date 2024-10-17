const healthCheckController = require('./healthcheck.controller')
const sinon = require('sinon')
const chai = require('chai')
const expect = chai.expect

describe('Healthcheck controller', function () {
  it('should return healthy', function (done) {
    const setHeaderStub = sinon.stub()
    const jsonStub = sinon.stub()
    const res = {
      setHeader: setHeaderStub,
      json: jsonStub
    }
    const req = {
      headers: { accept: '' }
    }

    healthCheckController.healthcheck(req, res)
    expect(setHeaderStub.calledWith('Content-Type', 'application/json')).to.be.equal(true)
    expect(jsonStub.calledWith({ ping: { healthy: true } })).to.be.equal(true)
    done()
  })
})
