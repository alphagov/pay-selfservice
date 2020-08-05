'use strict'

// NPM Dependencies
const path = require('path')
const expect = require('chai').expect
const _ = require('lodash')
const EventEmitter = require('events').EventEmitter
const proxyquire = require('proxyquire')

describe('email notification', function () {
  describe('getting the template body', function () {
    describe('when connector returns an error', function () {
      it('should return client unavailable', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions {
          getAccount () {
            return Promise.reject(new Error('connection error'))
          }
        }
        let sCEFinst = new StubConnectorEmailFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCEFinst
          }
        }
        let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
          '../services/clients/connector.client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.get(123))
          .to.be.rejectedWith('CONNECTOR_FAILED')
      }
      )
    })

    describe('when connector returns correctly', function () {
      it('should return the correct promise', function () {
        class StubConnectorEmailFunctions {
          getAccount (params) {
            /* eslint-disable */
            return Promise.resolve(
              {
                gateway_account_id: 31,
                service_name: '8b9370c1a83c4d71a538a1691236acc2',
                type: 'test',
                analytics_id: '8b02c7e542e74423aa9e6d0f0628fd58',
                email_collection_mode: 'MANDATORY',
                email_notifications: {
                  PAYMENT_CONFIRMED: {
                    version: 1,
                    enabled: true,
                    template_body: 'template here'
                  },
                  REFUND_ISSUED: {
                    version: 1,
                    enabled: true
                  }
                }
              })
            /* eslint-enable */
          }
        }
        let sCEFinst = new StubConnectorEmailFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCEFinst
          }
        }
        let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
          '../services/clients/connector.client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.get(123))
          .to.be.fulfilled.then(function (response) {
            expect(response).to.deep.equal({
              customEmailText: 'template here',
              emailEnabled: true,
              emailCollectionMode: 'MANDATORY',
              refundEmailEnabled: true
            })
          })
      })
    })
  })

  describe('updating the email notification template body', function () {
    describe('when connector is unavailable', function () {
      it('should return client unavailable', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions extends EventEmitter {
          updateConfirmationEmail () {
            setTimeout(() => {
              this.emit('connectorError', { thisIs: 'anErrorObject' })
            }, 100)
            return this
          }
        }
        let sCEFinst = new StubConnectorEmailFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCEFinst
          }
        }
        let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
          '../services/clients/connector.client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.updateConfirmationTemplate(123))
          .to.be.rejectedWith('CONNECTOR_FAILED')
      }
      )
    })

    describe('when connector returns incorrect response code', function () {
      it('should return POST_FAILED', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions extends EventEmitter {
          updateConfirmationEmail () {
            setTimeout(() => {
              this.emit('connectorError', { thisIs: 'anErrorObject' }, { thisIs: 'aConnectorResponse' })
            }, 100)
            return this
          }
        }
        let sCEFinst = new StubConnectorEmailFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCEFinst
          }
        }
        let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
          '../services/clients/connector.client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.updateConfirmationTemplate(123))
          .to.be.rejectedWith('POST_FAILED')
      })
    })

    describe('when connector returns correctly', function () {
      it('should update the email notification template body', function () {
        class StubConnectorEmailFunctions extends EventEmitter {
          updateConfirmationEmail (params, callback) {
            callback()
            return this
          }
        }
        let sCEFinst = new StubConnectorEmailFunctions()
        let connectorClientStub = {
          ConnectorClient: function () {
            return sCEFinst
          }
        }
        let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
          '../services/clients/connector.client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.updateConfirmationTemplate(123)).to.be.fulfilled
      })
    })
  })

  describe('enabling/disabling email notifications', function () {
    _.each([true, false], function (toggle) {
      describe('when connector is unavailable', function () {
        it('should return client unavailable', function () {
          // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
          class StubConnectorEmailFunctions extends EventEmitter {
            updateConfirmationEmailEnabled () {
              setTimeout(() => {
                this.emit('connectorError', { thisIs: 'anErrorObject' })
              }, 100)
              return this
            }
          }
          let sCEFinst = new StubConnectorEmailFunctions()
          let connectorClientStub = {
            ConnectorClient: function () {
              return sCEFinst
            }
          }
          let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
            '../services/clients/connector.client.js': connectorClientStub
          })
          const emailModel = Email('some-unique-id')
          return expect(emailModel.setConfirmationEnabled(123, toggle))
            .to.be.rejectedWith('CONNECTOR_FAILED')
        }
        )
      })

      describe('when connector returns incorrect response code', function () {
        it('should return PATCH_FAILED', function () {
          // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
          class StubConnectorEmailFunctions extends EventEmitter {
            updateConfirmationEmailEnabled () {
              setTimeout(() => {
                this.emit('connectorError', { thisIs: 'anErrorObject' }, { thisIs: 'aConnectorResponse' })
              }, 100)
              return this
            }
          }
          let sCEFinst = new StubConnectorEmailFunctions()
          let connectorClientStub = {
            ConnectorClient: function () {
              return sCEFinst
            }
          }
          let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
            '../services/clients/connector.client.js': connectorClientStub
          })
          const emailModel = Email('some-unique-id')
          return expect(emailModel.setConfirmationEnabled(123, true))
            .to.be.rejectedWith('PATCH_FAILED')
        })
      })

      describe('when connector returns correctly', function () {
        it('should disable email notifications', function () {
          // Create a class that inherits from EventEmitter
          class StubConnectorEmailFunctions extends EventEmitter {
            updateConfirmationEmailEnabled (params, callback) {
              callback()
              return this
            }
          }
          let sCEFinst = new StubConnectorEmailFunctions()
          let connectorClientStub = {
            ConnectorClient: function () {
              return sCEFinst
            }
          }
          let Email = proxyquire(path.join(__dirname, '/../../../app/models/email.js'), {
            '../services/clients/connector.client.js': connectorClientStub
          })
          const emailModel = Email('some-unique-id')
          return expect(emailModel.setConfirmationEnabled(123, true)).to.be.fulfilled
        })
      })
    })
  })
})
