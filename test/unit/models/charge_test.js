'use strict'

// NPM Dependencies
const path = require('path')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const expect = require('chai').expect
const EventEmitter = require('events').EventEmitter

// Local Dependencies
const userFixtures = require('../../fixtures/user_fixtures')
const User = require('../../../app/models/User.class')

describe('charge model', function () {
  describe('findWithEvents', function () {
    describe('when connector is unavailable', function () {
      it('should return client unavailable', function () {
          // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorChargeFunctions extends EventEmitter {
          getCharge () {
            setTimeout(() => {
              this.emit('connectorError', {thisIs: 'anErrorObject'})
            }, 100)
            return this
          }
          getChargeEvents () {
            return this
          }
          }
        let sCCFinst = new StubConnectorChargeFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCCFinst
          }
        }
        let Charge = proxyquire(path.join(__dirname, '/../../../app/models/charge.js'), {
          '../services/clients/connector_client.js': connectorClientStub
        })
        const chargeModel = Charge('correlation-id')
        return expect(chargeModel.findWithEvents(1, 1))
            .to.be.rejectedWith('CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code', function () {
      it('should return get_failed', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorChargeFunctions extends EventEmitter {
          getCharge () {
            setTimeout(() => {
              this.emit('connectorError', {thisIs: 'anErrorObject'}, {statusCode: 201})
            }, 100)
            return this
          }
          getChargeEvents () {
            return this
          }
        }
        let sCCFinst = new StubConnectorChargeFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCCFinst
          }
        }
        let Charge = proxyquire(path.join(__dirname, '/../../../app/models/charge.js'), {
          '../services/clients/connector_client.js': connectorClientStub
        })
        const chargeModel = Charge('some-unique-id')
        return expect(chargeModel.findWithEvents(1, 1))
          .to.be.rejectedWith('GET_FAILED')
      })
    })

    describe('when adminusers returns incorrect response code', function () {
      it('should return get_failed', function () {
        // Create a class that inherits from EventEmitter
        class StubConnectorChargeFunctions extends EventEmitter {
          getCharge (params, callback) {
            callback({foo: 'bar'}) // eslint-disable-line
            return this
          }
          getChargeEvents (params, callback) {
            callback({events: [{submitted_by: 'abc123'}]}) // eslint-disable-line
            return this
          }
        }
        let sCCFinst = new StubConnectorChargeFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCCFinst
          }
        }
        let userServiceStub = {
          findMultipleByExternalIds: function () {
            return new Promise(function (resolve, reject) {
              reject({errorCode: 405, iam: 'anError'}) // eslint-disable-line
            })
          }
        }
        let Charge = proxyquire(path.join(__dirname, '/../../../app/models/charge.js'), {
          '../services/clients/connector_client.js': connectorClientStub,
          '../services/user_service': userServiceStub
        })
        const chargeModel = Charge('some-unique-id')
        return expect(chargeModel.findWithEvents(1, 1))
          .to.be.rejectedWith('GET_FAILED')
      })
    })

    describe('when connector returns correctly', function () {
      it('should return the correct promise', function () {
        let user = userFixtures.validUser().getPlain()
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorChargeFunctions extends EventEmitter {
          getCharge (params, callback) {
            callback({foo: 'bar'}) // eslint-disable-line
            return this
          }
          getChargeEvents (params, callback) {
            callback({events: [{submitted_by: user.external_id}]}) // eslint-disable-line
            return this
          }
        }
        let sCCFinst = new StubConnectorChargeFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCCFinst
          }
        }
        let userServiceStub = {
          findMultipleByExternalIds: function () {
            return new Promise(function (resolve, reject) {
              resolve([new User(user)])
            })
          }
        }
        let buildPaymentView = sinon.spy()
        let Charge = proxyquire(path.join(__dirname, '/../../../app/models/charge.js'), {
          '../services/clients/connector_client.js': connectorClientStub,
          '../services/user_service': userServiceStub,
          '../utils/transaction_view.js': {buildPaymentView}
        })

        const chargeModel = Charge('correlation-id')
        return chargeModel.findWithEvents(1, 2).then(function () {
          expect(buildPaymentView.called).to.equal(true)
          expect(buildPaymentView.args.length).to.equal(1)
          expect(buildPaymentView.args[0].length).to.equal(3)
          expect(buildPaymentView.args[0][0]).to.deep.equal({foo: 'bar'})
          expect(buildPaymentView.args[0][1]).to.deep.equal({events: [{submitted_by: user.external_id}]})
          expect(buildPaymentView.args[0][2]).to.deep.equal([new User(user)])
        })
      })
    })
  })
})
