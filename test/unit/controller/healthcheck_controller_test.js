var path = require('path')
var healthCheckController = require(path.join(__dirname, '/../../../app/controllers/healthcheck_controller.js'))
var sinon = require('sinon')
var chai = require('chai')
var expect = chai.expect

describe('Healthcheck controller', function () {
  it('should return healthy', function (done) {
    let setHeaderStub = sinon.stub()
    let jsonStub = sinon.stub()
    let res = {
      setHeader: setHeaderStub,
      json: jsonStub
    }
    let req = {
      headers: {accept: ''}
    }

    healthCheckController.healthcheck(req, res)
    expect(setHeaderStub.calledWith('Content-Type', 'application/json')).to.be.equal(true)
    expect(jsonStub.calledWith({'ping': {'healthy': true}})).to.be.equal(true)
    done()
  })
})
