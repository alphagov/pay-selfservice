import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import { expect } from 'chai'
import paths, { formattedPathFor } from '@root/paths'
import { formatSimplifiedAccountPathsFor } from '@utils/simplified-account/format'
import ServiceRole from '@models/service/ServiceRole.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { validServiceResponse } from '@test/fixtures/service.fixtures'
import { validGatewayAccount } from '@test/fixtures/gateway-account.fixtures'
import { WORLDPAY, SANDBOX, STRIPE } from '@models/constants/payment-providers'
import { LIVE, NOT_STARTED } from '@models/constants/go-live-stage'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { MergedServiceWithGateways } from '@utils/simplified-account/home/my-services/service-presentation-utils'
import { Message } from '@utils/types/express/Message'
import Service from '@models/service/Service.class'
import { Mutable } from '@utils/types/mutable'

const SERVICE_NAME = 'Test service'
const SERVICE_EXTERNAL_ID = 'service-123-abc'

const mockResponse = sinon.stub()
const mockGatewayAccountService = {
  getGatewayAccountsByIds: sinon.stub().resolves({
    32: new GatewayAccount(
      validGatewayAccount({
        gateway_account_id: 32,
        service_name: SERVICE_NAME,
        type: GatewayAccountType.TEST,
        payment_provider: WORLDPAY,
      })
    ),
    33: new GatewayAccount(
      validGatewayAccount({
        gateway_account_id: 33,
        service_name: SERVICE_NAME,
        type: GatewayAccountType.LIVE,
        payment_provider: WORLDPAY,
      })
    ),
    34: new GatewayAccount(
      validGatewayAccount({
        gateway_account_id: 34,
        service_name: SERVICE_NAME,
        type: GatewayAccountType.TEST,
        payment_provider: STRIPE,
      })
    ),
    35: new GatewayAccount(
      validGatewayAccount({
        gateway_account_id: 35,
        service_name: SERVICE_NAME,
        type: GatewayAccountType.TEST,
        payment_provider: SANDBOX,
      })
    ),
  }),
}

const userServiceRoles = [
  new ServiceRole({
    role: {
      name: 'admin',
      description: '',
      permissions: [],
    },
    service: validServiceResponse({
      external_id: SERVICE_EXTERNAL_ID,
      gateway_account_ids: [],
      name: SERVICE_NAME,
      service_name: {
        en: SERVICE_NAME,
      },
      current_go_live_stage: LIVE,
    }),
  }),
]

const { nextRequest, nextResponse, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/home/my-services/my-services.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/gateway-accounts.service': mockGatewayAccountService,
  })
  .build()

describe('Controller: home/my-services/my-services.controller', () => {
  describe('get', () => {
    describe('when user has service with live and test accounts', () => {
      beforeEach(async () => {
        ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['32', '33']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles,
          },
        })
        await call('get')
      })

      it('should call the response method with correct template', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/home/my-services/index'
        )
      })

      it('should pass correct service paths', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          createServicePath: paths.services.create.index,
          allServiceTransactionsPath: formattedPathFor(
            paths.allServiceTransactions.indexStatusFilter,
            'live'
          ) as string,
          payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, 'live') as string,
        })
      })

      it('should pass services array and flags', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          services: sinon.match.array,
          flags: sinon.match({
            hasLiveAccount: true,
          }),
        })
      })

      it('should pass empty messages array when no flash messages', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: [],
        })
      })

      it('should set service href to live account dashboard when live account present', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          services: sinon.match((services: MergedServiceWithGateways[]) => {
            expect(services).to.have.length(1)
            expect(services[0].href).to.equal(
              formatSimplifiedAccountPathsFor(
                paths.simplifiedAccount.dashboard.index,
                SERVICE_EXTERNAL_ID,
                GatewayAccountType.LIVE
              )
            )
            return true
          }),
        })
      })
    })

    describe('when user has service with only test accounts', () => {
      beforeEach(async () => {
        ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['34', '35']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles,
          },
        })
        await call('get')
      })

      it('should use test path filter for service paths', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          allServiceTransactionsPath: formattedPathFor(
            paths.allServiceTransactions.indexStatusFilter,
            'test'
          ) as string,
          payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, 'test') as string,
        })
      })

      it('should set hasLiveAccount flag to false', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          flags: sinon.match({
            hasLiveAccount: sinon.match.falsy,
          }),
        })
      })

      it('should set service href to test account dashboard when only test accounts present', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          services: sinon.match((services: MergedServiceWithGateways[]) => {
            expect(services).to.have.length(1)
            expect(services[0].href).to.equal(
              formatSimplifiedAccountPathsFor(
                paths.simplifiedAccount.dashboard.index,
                SERVICE_EXTERNAL_ID,
                GatewayAccountType.TEST
              )
            )
            return true
          }),
        })
      })
    })

    describe('when invite success flash message present', () => {
      beforeEach(async () => {
        ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['32']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles,
          },
        })
        nextResponse({
          locals: {
            flash: {
              inviteSuccessServiceId: [SERVICE_EXTERNAL_ID],
            },
          },
        })
        await call('get')
      })

      it('should set recentlyInvitedServiceExternalId flag', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          flags: sinon.match({
            recentlyInvitedServiceExternalId: SERVICE_EXTERNAL_ID,
          }),
        })
      })

      it('should include success message', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: sinon.match((messages: Message[]) => {
            expect(messages).to.have.length(1)
            expect(messages[0]).to.deep.include({
              state: 'success',
              icon: '&check;',
            })
            expect(messages[0].heading).to.include('You have been added to')
            return true
          }),
        })
      })
    })

    describe('when custom flash messages present', () => {
      beforeEach(async () => {
        ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['32']
        nextRequest({
          user: {
            serviceRoles: userServiceRoles,
          },
        })
        nextResponse({
          locals: {
            flash: {
              messages: [{ text: 'Custom message', type: 'info' }],
            },
          },
        })
        await call('get')
      })

      it('should pass through custom flash messages', () => {
        sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: [{ text: 'Custom message', type: 'info' }],
        })
      })
    })

    describe('service status scenarios', () => {
      describe('when service has disabled gateway account', () => {
        beforeEach(async () => {
          mockGatewayAccountService.getGatewayAccountsByIds.resolves({
            36: new GatewayAccount(
              validGatewayAccount({
                gateway_account_id: 36,
                service_name: SERVICE_NAME,
                type: GatewayAccountType.LIVE,
                payment_provider: STRIPE,
                disabled: true,
              })
            ),
          })
          ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['36']
          ;(userServiceRoles[0].service as Mutable<Service>).currentGoLiveStage = NOT_STARTED
          nextRequest({
            user: {
              serviceRoles: userServiceRoles,
            },
          })
          await call('get')
        })

        it('should set service status to "Not taking payments" with red tag', () => {
          sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
            services: sinon.match((services: MergedServiceWithGateways[]) => {
              expect(services).to.have.length(1)
              expect(services[0].status).to.deep.equal({
                tag: {
                  text: 'Not taking payments',
                  colour: 'govuk-tag--red',
                },
              })
              return true
            }),
          })
        })
      })

      describe('when service is not live and has Worldpay test account only', () => {
        beforeEach(async () => {
          mockGatewayAccountService.getGatewayAccountsByIds.resolves({
            32: new GatewayAccount(
              validGatewayAccount({
                gateway_account_id: 32,
                service_name: SERVICE_NAME,
                type: GatewayAccountType.TEST,
                payment_provider: WORLDPAY,
                disabled: false,
              })
            ),
          })
          ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['32']
          ;(userServiceRoles[0].service as Mutable<Service>).currentGoLiveStage = NOT_STARTED
          nextRequest({
            user: {
              serviceRoles: userServiceRoles,
            },
          })
          await call('get')
        })

        it('should set service status to "Worldpay test" with grey tag', () => {
          sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
            services: sinon.match((services: MergedServiceWithGateways[]) => {
              expect(services).to.have.length(1)
              expect(services[0].status).to.deep.equal({
                tag: {
                  text: 'Worldpay test',
                  colour: 'govuk-tag--grey',
                },
              })
              return true
            }),
          })
        })
      })

      describe('when service is not live and has a non-Worldpay test account', () => {
        beforeEach(async () => {
          mockGatewayAccountService.getGatewayAccountsByIds.resolves({
            34: new GatewayAccount(
              validGatewayAccount({
                gateway_account_id: 34,
                service_name: SERVICE_NAME,
                type: GatewayAccountType.TEST,
                payment_provider: STRIPE,
                disabled: false,
              })
            ),
          })
          ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['34']
          ;(userServiceRoles[0].service as Mutable<Service>).currentGoLiveStage = NOT_STARTED
          nextRequest({
            user: {
              serviceRoles: userServiceRoles,
            },
          })
          await call('get')
        })

        it('should set service status to "Not live yet" with blue tag', () => {
          sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
            services: sinon.match((services: MergedServiceWithGateways[]) => {
              expect(services).to.have.length(1)
              expect(services[0].status).to.deep.equal({
                tag: {
                  text: 'Not live yet',
                  colour: 'govuk-tag--blue',
                },
              })
              return true
            }),
          })
        })
      })

      describe('when service is live', () => {
        beforeEach(async () => {
          mockGatewayAccountService.getGatewayAccountsByIds.resolves({
            33: new GatewayAccount(
              validGatewayAccount({
                gateway_account_id: 33,
                service_name: SERVICE_NAME,
                type: GatewayAccountType.LIVE,
                payment_provider: WORLDPAY,
                disabled: false,
              })
            ),
          })
          ;(userServiceRoles[0].service as Mutable<Service>).gatewayAccountIds = ['33']
          ;(userServiceRoles[0].service as Mutable<Service>).currentGoLiveStage = LIVE
          nextRequest({
            user: {
              serviceRoles: userServiceRoles,
            },
          })
          await call('get')
        })

        it('should not set service status (undefined)', () => {
          sinon.assert.calledWithMatch(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
            services: sinon.match((services: MergedServiceWithGateways[]) => {
              expect(services).to.have.length(1)
              expect(services[0].status).to.be.undefined
              return true
            }),
          })
        })
      })
    })
  })
})
