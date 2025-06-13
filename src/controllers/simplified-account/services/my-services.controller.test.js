const sinon = require('sinon')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const ServiceRole = require('@models/service/ServiceRole.class')
const GatewayAccount = require('@models/gateway-account/GatewayAccount.class')
const { expect } = require('chai')
const { WORLDPAY, SANDBOX, STRIPE } = require('@models/constants/payment-providers')
const { LIVE } = require('@models/constants/go-live-stage')
const { validServiceResponse } = require('@test/fixtures/service.fixtures')
const { validGatewayAccount } = require('@test/fixtures/gateway-account.fixtures')
const { formattedPathFor } = require('@root/paths')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')

const SERVICE_NAME = 'Rare coin authentication service'
const SERVICE_EXTERNAL_ID = 'service-123-def'

const mockResponse = sinon.spy()
const mockGatewayAccountService = {
  getGatewayAccountsByIds: sinon.stub().resolves({
    32: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 32,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: WORLDPAY
    })),
    33: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 33,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: 'unsupported payment provider'
    })),
    34: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 34,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: STRIPE
    })),
    35: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 35,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: SANDBOX
    })),
    36: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 36,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: SANDBOX
    })),
    37: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 37,
      service_name: SERVICE_NAME,
      type: 'live',
      payment_provider: WORLDPAY
    })),
    38: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 38,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: SANDBOX,
      disabled: true
    })),
    39: new GatewayAccount(validGatewayAccount({
      gateway_account_id: 39,
      service_name: SERVICE_NAME,
      type: 'test',
      payment_provider: SANDBOX,
      disabled: true
    }))
  })
}
const userServiceRoles = [
  new ServiceRole({
    role: {
      name: 'admin',
      permissions: []
    },
    service: validServiceResponse({
      external_id: SERVICE_EXTERNAL_ID,
      gateway_account_ids: [],
      name: SERVICE_NAME,
      service_name: {
        en: SERVICE_NAME
      },
      current_go_live_stage: LIVE
    })
  })
]

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/services/my-services.controller')
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/gateway-accounts.service': mockGatewayAccountService
  })
  .build()

describe('Controller: services/my-services.controller', () => {
  describe('get', () => {
    describe('for a service with two sandbox test accounts and a live account', () => {
      before(() => {
        userServiceRoles[0].service.gatewayAccountIds = ['35', '36', '37']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles
          }
        })
        call('get')
      })

      it('should call the response method with expected parameters', () => {
        sinon.assert.calledOnceWithMatch(mockResponse,
          req,
          res,
          'simplified-account/services/my-services/index',
          {
            createServicePath: paths.services.create.index,
            allServiceTransactionsPath: formattedPathFor(paths.allServiceTransactions.indexStatusFilter, 'live'),
            payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, 'live'),
            services: [
              sinon.match.any
            ],
            flags: sinon.match({
              hasLiveAccount: true
            })
          }
        )
      })
      it('should filter test gateway accounts', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            services: [
              sinon.match({
                name: SERVICE_NAME,
                gatewayAccounts: sinon.match(accounts => {
                  expect(accounts.length).to.equal(2)
                  expect(accounts[0].type).to.equal('live')
                  expect(accounts[0].paymentProvider).to.equal(WORLDPAY)
                  expect(accounts[1].id).to.equal(36)
                  expect(accounts[1].type).to.equal('test')
                  expect(accounts[1].paymentProvider).to.equal(SANDBOX)
                  return true
                })
              })
            ]
          })
        )
      })
      it('should set new style settings links for live account', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            services: [
              sinon.match({
                gatewayAccounts: sinon.match(accounts => {
                  expect(accounts[0].links.editServiceNameLink).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_EXTERNAL_ID, 'live'))
                  expect(accounts[0].links.manageTeamMembersLink).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, SERVICE_EXTERNAL_ID, 'live'))
                  expect(accounts[0].links.organisationDetailsLink).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, SERVICE_EXTERNAL_ID, 'live'))
                  return true
                })
              })
            ]
          })
        )
      })
    })
    describe('for a service with a test sandbox account, a test stripe account and no live account', () => {
      before(() => {
        userServiceRoles[0].service.gatewayAccountIds = ['34', '36']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles
          }
        })
        call('get')
      })

      it('should reformat links for test', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            allServiceTransactionsPath: formattedPathFor(paths.allServiceTransactions.indexStatusFilter, 'test'),
            payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, 'test'),
            services: [
              sinon.match({
                gatewayAccounts: sinon.match(accounts => {
                  expect(accounts[0].links.editServiceNameLink).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_EXTERNAL_ID, 'test'))
                  expect(accounts[0].links.manageTeamMembersLink).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, SERVICE_EXTERNAL_ID, 'test'))
                  expect(accounts[0].links.organisationDetailsLink).to.equal(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, SERVICE_EXTERNAL_ID, 'test'))
                  return true
                })
              })
            ]
          })
        )
      })

      it('should filter test gateway accounts and prioritise based on payment provider', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            services: [
              sinon.match({
                name: SERVICE_NAME,
                gatewayAccounts: sinon.match(accounts => {
                  expect(accounts.length).to.equal(1)
                  expect(accounts[0].type).to.equal('test')
                  expect(accounts[0].paymentProvider).to.equal(STRIPE)
                  return true
                })
              })
            ]
          })
        )
      })
    })
    describe('for a service with an unsupported test account and a live account', () => {
      before(() => {
        userServiceRoles[0].service.gatewayAccountIds = ['33', '37']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles
          }
        })
        call('get')
      })

      it('should filter the unsupported test gateway account', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            services: [
              sinon.match({
                name: SERVICE_NAME,
                gatewayAccounts: sinon.match(accounts => {
                  expect(accounts.length).to.equal(1)
                  expect(accounts[0].type).to.equal('live')
                  expect(accounts[0].paymentProvider).to.equal(WORLDPAY)
                  return true
                })
              })
            ]
          })
        )
      })
    })
    describe('for a service with disabled test gateway accounts', () => {
      before(() => {
        userServiceRoles[0].service.gatewayAccountIds = ['32', '38', '39']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles
          }
        })
        call('get')
      })

      it('should filter out the disabled test gateway accounts', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          sinon.match({
            services: [
              sinon.match({
                name: SERVICE_NAME,
                gatewayAccounts: sinon.match(accounts => {
                  expect(accounts.length).to.equal(1)
                  expect(accounts[0].type).to.equal('test')
                  expect(accounts[0].paymentProvider).to.equal(WORLDPAY)
                  return true
                })
              })
            ]
          })
        )
      })
    })
  })
})
