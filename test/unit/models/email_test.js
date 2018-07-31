'use strict'

// NPM Dependencies
const path = require('path')
const expect = require('chai').expect
const _ = require('lodash')
const EventEmitter = require('events').EventEmitter
const proxyquire = require('proxyquire')

describe('email notification', function () {
  describe('getting the template body', function () {
    describe('when connector is unavailable', function () {
      it('should return client unavailable', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions extends EventEmitter {
          getNotificationEmail () {
            setTimeout(() => {
              this.emit('connectorError')
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
          '../services/clients/connector_client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.get(123))
          .to.be.rejectedWith('CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code', function () {
      it('should return get_failed', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions extends EventEmitter {
          getNotificationEmail () {
            setTimeout(() => {
              this.emit('connectorError', {thisIs: 'anErrorObject'}, {thisIs: 'aConnectorResponse'})
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
          '../services/clients/connector_client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.get(123))
          .to.be.rejectedWith('GET_FAILED')
      })
    })

    describe('when connector returns correctly', function () {
      it('should return the correct promise', function () {
        // Create a class that inherits from EventEmitter
        class StubConnectorEmailFunctions extends EventEmitter {
          getNotificationEmail (params, callback) {
            callback({template_body: 'some template here', enabled: true}) // eslint-disable-line
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
          '../services/clients/connector_client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.get(123))
          .to.be.fulfilled.then(function (response) {
            expect(response).to.deep.equal({customEmailText: 'some template here', emailEnabled: true})
          })
      })
    })
  })

  describe('updating the email notification template body', function () {
    describe('when connector is unavailable', function () {
      it('should return client unavailable', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions extends EventEmitter {
          updateNotificationEmail () {
            setTimeout(() => {
              this.emit('connectorError', {thisIs: 'anErrorObject'})
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
          '../services/clients/connector_client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.update(123))
          .to.be.rejectedWith('CLIENT_UNAVAILABLE')
      }
      )
    })

    describe('when connector returns incorrect response code', function () {
      it('should return POST_FAILED', function () {
        // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
        class StubConnectorEmailFunctions extends EventEmitter {
          updateNotificationEmail () {
            setTimeout(() => {
              this.emit('connectorError', {thisIs: 'anErrorObject'}, {thisIs: 'aConnectorResponse'})
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
          '../services/clients/connector_client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.update(123))
          .to.be.rejectedWith('POST_FAILED')
      })
    })

    describe('when connector returns correctly', function () {
      it('should update the email notification template body', function () {
        class StubConnectorEmailFunctions extends EventEmitter {
          updateNotificationEmail (params, callback) {
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
          '../services/clients/connector_client.js': connectorClientStub
        })
        const emailModel = Email('some-unique-id')
        return expect(emailModel.update(123)).to.be.fulfilled
      })
    })
  })

  describe('enabling/disabling email notifications', function () {
    _.each([true, false], function (toggle) {
      describe('when connector is unavailable', function () {
        it('should return client unavailable', function () {
          // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
          class StubConnectorEmailFunctions extends EventEmitter {
            updateNotificationEmailEnabled () {
              setTimeout(() => {
                this.emit('connectorError', {thisIs: 'anErrorObject'})
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
            '../services/clients/connector_client.js': connectorClientStub
          })
          const emailModel = Email('some-unique-id')
          return expect(emailModel.setEnabled(123, toggle))
            .to.be.rejectedWith('CLIENT_UNAVAILABLE')
        }
        )
      })

      describe('when connector returns incorrect response code', function () {
        it('should return PATCH_FAILED', function () {
          // Create a class that inherits from EventEmitter and emit a 'connectorError' event which is handled by the service
          class StubConnectorEmailFunctions extends EventEmitter {
            updateNotificationEmailEnabled () {
              setTimeout(() => {
                this.emit('connectorError', {thisIs: 'anErrorObject'}, {thisIs: 'aConnectorResponse'})
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
            '../services/clients/connector_client.js': connectorClientStub
          })
          const emailModel = Email('some-unique-id')
          return expect(emailModel.setEnabled(123, true))
            .to.be.rejectedWith('PATCH_FAILED')
        })
      })

      describe('when connector returns correctly', function () {
        it('should disable email notifications', function () {
          // Create a class that inherits from EventEmitter
          class StubConnectorEmailFunctions extends EventEmitter {
            updateNotificationEmailEnabled (params, callback) {
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
            '../services/clients/connector_client.js': connectorClientStub
          })
          const emailModel = Email('some-unique-id')
          return expect(emailModel.setEnabled(123, true)).to.be.fulfilled
        })
      })
    })
  })
})
