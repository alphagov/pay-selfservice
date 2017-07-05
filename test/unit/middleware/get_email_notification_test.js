const path = require('path')
const assert = require('assert')
const sinon = require('sinon')
const nock = require('nock')
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const retrieveEmailNotification = require(path.join(__dirname, '/../../../app/middleware/get_email_notification.js'))

chai.use(chaiAsPromised)

describe('retrieve email notification template', function () {
  const response = {
    status: () => {},
    render: () => {},
    setHeader: () => {}
  }
  let render, next

  beforeEach(function () {
    render = sinon.stub(response, 'render')
    next = sinon.spy()
    nock.cleanAll()
  })

  afterEach(function () {
    render.restore()
  })

  it('should call the error view if connector call fails', function (done) {
    const req = {account: {gateway_account_id: 1}, headers: {}}
    retrieveEmailNotification(req, response, next)
    setTimeout(function () {
      expect(next.notCalled).to.be.true // eslint-disable-line
      assert(render.calledWith('error', {message: 'There is a problem with the payments platform'}))
      done()
    }, 100)
  })

  it('should merge account with email notification template data and call next on success', function (done) {
    nock(process.env.CONNECTOR_URL)
      .get('/v1/api/accounts/1/email-notification')
      .reply(200, {template_body: 'hello', enabled: true})

    const req = {account: {gateway_account_id: 1}, headers: {}}

    retrieveEmailNotification(req, response, next).should.be.fulfilled.then(function () {
      expect(req.account).to.deep.equal({
        customEmailText: 'hello',
        'gateway_account_id': 1,
        'emailEnabled': true
      })
      expect(next.called).to.be.true // eslint-disable-line
    }).should.notify(done)
  })
})
