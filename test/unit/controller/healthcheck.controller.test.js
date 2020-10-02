const path = require('path')
const sinon = require('sinon')
const healthCheckController = require(path.join(__dirname, '/../../../app/controllers/healthcheck.controller.js'))

describe('Healthcheck controller', () => {
  it('should return healthy', done => {
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
    expect(setHeaderStub.calledWith('Content-Type', 'application/json')).toBe(true)
    expect(jsonStub.calledWith({ 'ping': { 'healthy': true } })).toBe(true)
    done()
  })
})
