const path = require('path')
const sinon = require('sinon')
const { expect } = require('chai')
const healthCheckController = require(path.join(__dirname, '/../../../app/controllers/healthcheck.controller.js'))

describe('Healthcheck controller', function () {
  it('should return healthy', function (done) {
    let setHeaderStub = sinon.stub()
    let jsonStub = sinon.stub()
    let res = {
      setHeader: setHeaderStub,
      json: jsonStub
    }
    let req = {
      headers: { accept: '' }
    }

    healthCheckController.healthcheck(req, res)
    expect(setHeaderStub.calledWith('Content-Type', 'application/json')).to.be.equal(true)
    expect(jsonStub.calledWith({ 'ping': { 'healthy': true } })).to.be.equal(true)
    done()
  })
})
