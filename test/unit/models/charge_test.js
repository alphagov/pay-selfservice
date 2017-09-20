const path = require('path')
require(path.join(__dirname, '/../../test_helpers/html_assertions.js'))
const assert = require('assert')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const expect = require('chai').expect
const userFixtures = require('../../fixtures/user_fixtures')
const nock = require('nock')
const User = require('../../../app/models/User.class')
const wrongPromise = function (data) {
  throw new Error('Promise was unexpectedly fulfilled.')
}
let Charge, buildPaymentView, user

describe('charge model', function () {
  beforeEach(() => {
    buildPaymentView = sinon.spy()
    Charge = proxyquire(path.join(__dirname, '/../../../app/models/charge.js'), {
      '../utils/transaction_view.js': {buildPaymentView}
    })
  })
  describe('findWithEvents', function () {
    describe('when connector is unavailable', function () {
      before(function () {
        nock.cleanAll()
      })

      after(function () {
        nock.cleanAll()
      })

      it('should return client unavailable', function () {
        var chargeModel = Charge('correlation-id')
        return chargeModel.findWithEvents(1, 1).then(wrongPromise,
            function rejected (error) {
              assert.equal(error, 'CLIENT_UNAVAILABLE')
            }
          )
      }
      )
    })

    describe('when connector returns incorrect response code', function () {
      var defaultCorrelationHeader = {
        reqheaders: {'x-request-id': 'some-unique-id'}
      }

      before(function () {
        nock.cleanAll()

        nock(process.env.CONNECTOR_URL, defaultCorrelationHeader)
          .get('/v1/api/accounts/1/charges/2')
          .reply(405, '')
      })

      it('should return get_failed', function () {
        var chargeModel = Charge('some-unique-id')
        return chargeModel.findWithEvents(1, 2).then(wrongPromise,
          function rejected (error) {
            assert.equal(error, 'GET_FAILED')
          })
      })
    })

    describe('when adminusers returns incorrect response code', function () {
      before(function () {
        nock.cleanAll()

        nock(process.env.CONNECTOR_URL)
          .get('/v1/api/accounts/1/charges/2')
          .reply(200, { foo: 'bar' })

        nock(process.env.CONNECTOR_URL)
          .get('/v1/api/accounts/1/charges/2/events')
          .reply(200, {events: [{ submitted_by: 'abc123' }]})

        nock(process.env.ADMINUSERS_URL)
          .get('/v1/api/users?ids=abc123')
          .reply(405)
      })

      it('should return get_failed', function () {
        var chargeModel = Charge('some-unique-id')
        return chargeModel.findWithEvents(1, 2).then(wrongPromise,
          function rejected (error) {
            assert.equal(error, 'GET_FAILED')
          })
      })
    })

    describe('when connector returns correctly', function () {
      before(function () {
        nock.cleanAll()
        user = userFixtures.validUser().getPlain()

        nock(process.env.CONNECTOR_URL)
          .get('/v1/api/accounts/1/charges/2')
          .reply(200, {foo: 'bar'})

        nock(process.env.CONNECTOR_URL)
          .get('/v1/api/accounts/1/charges/2/events')
          .reply(200, {events: [{submitted_by: user.external_id}]})

        nock(process.env.ADMINUSERS_URL)
          .get(`/v1/api/users?ids=${user.external_id}`)
          .reply(200, [user])
      })

      it('should return the correct promise', function () {
        var chargeModel = Charge('correlation-id')
        return chargeModel.findWithEvents(1, 2).then(function (data) {
          expect(buildPaymentView.called).to.equal(true)
          expect(buildPaymentView.args.length).to.equal(1)
          expect(buildPaymentView.args[0].length).to.equal(3)
          expect(buildPaymentView.args[0][0]).to.deep.equal({foo: 'bar'})
          expect(buildPaymentView.args[0][1]).to.deep.equal({events: [{submitted_by: user.external_id}]})
          expect(buildPaymentView.args[0][2]).to.deep.equal([new User(user)])
        }, wrongPromise)
      })
    })
  })
})
