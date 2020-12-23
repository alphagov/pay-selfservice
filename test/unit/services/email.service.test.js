'use strict'

const path = require('path')
const expect = require('chai').expect
const _ = require('lodash')
const proxyquire = require('proxyquire')

function getEmailService (connectorClientStub) {
  return proxyquire(path.join(__dirname, '/../../../app/services/email.service.js'), {
    '../services/clients/connector.client.js': connectorClientStub
  })
}

const connectorClientSuccessStub = {
  ConnectorClient: function () {
    return {
      updateConfirmationEmail: function () {
        return Promise.resolve()
      },
      updateConfirmationEmailEnabled: function () {
        return Promise.resolve()
      },
      getAccount: function () {
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
      }
    }
  }
}

const connectorClientErrorsStub = {
  ConnectorClient: function () {
    return {
      updateConfirmationEmail: function () {
        return Promise.reject(new Error('connection error'))
      },
      updateConfirmationEmailEnabled: function () {
        return Promise.reject(new Error('connection error'))
      },
      getAccount: function () {
        return Promise.reject(new Error('connection error'))
      }
    }
  }
}

describe('email notification', function () {
  describe('getting the template body', function () {
    describe('when connector returns an error', function () {
      it('should throw error', function () {
        const emailService = getEmailService(connectorClientErrorsStub)
        return expect(emailService.getEmailSettings(123, 'some-unique-id'))
          .to.be.rejectedWith('Calling connector to get/patch account data threw exception')
      })
    })

    describe('when connector returns correctly', function () {
      it('should return the correct promise', function () {
        const emailService = getEmailService(connectorClientSuccessStub)
        return expect(emailService.getEmailSettings(123, 'some-unique-id'))
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
      it('should throw error', function () {
        const emailService = getEmailService(connectorClientErrorsStub)
        return expect(emailService.updateConfirmationTemplate(123, 'some-unique-id'))
          .to.be.rejectedWith('Calling connector to update email notifications for an account threw exception')
      })
    })

    describe('when connector returns correctly', function () {
      it('should update the email notification template body', function () {
        const emailService = getEmailService(connectorClientSuccessStub)
        return expect(emailService.updateConfirmationTemplate(123, 'some-unique-id')).to.be.fulfilled
      })
    })
  })

  describe('enabling/disabling email notifications', function () {
    _.each([true, false], function (toggle) {
      describe('when connector is unavailable', function () {
        it('should throw error', function () {
          const emailService = getEmailService(connectorClientErrorsStub)
          return expect(emailService.setConfirmationEnabled(123, toggle, 'some-unique-id'))
            .to.be.rejectedWith('Calling connector to update email notifications for an account threw exception')
        })
      })

      describe('when connector returns correctly', function () {
        it('should disable email notifications', function () {
          const emailService = getEmailService(connectorClientSuccessStub)
          return expect(emailService.setConfirmationEnabled(123, true, 'some-unique-id')).to.be.fulfilled
        })
      })
    })
  })
})
