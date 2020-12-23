'use strict'

const lodash = require('lodash')

const userFixtures = require('../../fixtures/user.fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const transactionDetailsFixtures = require('../../fixtures/refund.fixtures')
const ledgerTransactionFixtures = require('../../fixtures/ledger-transaction.fixtures')
const ledgerPayoutFixtures = require('../../fixtures/payout.fixtures')
const cardFixtures = require('../../fixtures/card.fixtures')
const serviceFixtures = require('../../fixtures/service.fixtures')
const goLiveRequestFixtures = require('../../fixtures/go-live-requests.fixture')
const stripeAccountSetupFixtures = require('../../fixtures/stripe-account-setup.fixtures')
const stripeAccountFixtures = require('../../fixtures/stripe-account.fixtures')
const productFixtures = require('../../fixtures/product.fixtures')
const goCardlessConnectFixtures = require('../../fixtures/go-cardless-connect.fixtures')
const ledgerFixture = require('../../fixtures/ledger-transaction.fixtures')
const inviteFixtures = require('../../fixtures/invite.fixtures')
const tokenFixtures = require('../../fixtures/token.fixtures')
const worldpay3dsFlexCredentialsFixtures = require('../../fixtures/worldpay-3ds-flex-credentials.fixtures')
const { stubBuilder } = require('../stubs/stub-builder')

const simpleStubBuilder = function simpleStubBuilder (method, path, responseCode, additionalParams = {}) {
  const stub = stubBuilder(method, path, responseCode, additionalParams)
  return [stub]
}

/**
 * Stub definitions added here should always use fixture builders to generate request and response bodys.
 * The fixture builders used should be validated by also being used in the pact tests for the API endpoint, and they
 * should be written in a strict enough way the JSON they produce will adhere to a validated structure.
 */
module.exports = {
  getUserSuccess: (opts = {}) => {
    const path = '/v1/api/users/' + opts.external_id
    return simpleStubBuilder('GET', path, 200, {
      response: userFixtures.validUserResponse(opts)
    })
  },
  getUsersSuccess: (opts = {}) => {
    const path = '/v1/api/users'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        ids: opts.userIds ? opts.userIds.join() : ''
      },
      response: userFixtures.validUsersResponse(opts.users)
    })
  },
  getUserSuccessRespondDifferentlySecondTime: (opts = {}) => {
    const aValidUserResponse = userFixtures.validUserResponse(opts.firstResponseOpts)
    const aSecondValidUserResponse = userFixtures.validUserResponse(opts.secondResponseOpts)
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/api/users/' + aValidUserResponse.external_id,
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aValidUserResponse
          },
          _behaviors: {
            repeat: opts.firstResponseOpts.repeat
          }
        }, {
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aSecondValidUserResponse
          },
          _behaviors: {
            repeat: opts.secondResponseOpts.repeat
          }
        }
        ]
      }
    ]
  },
  getServiceUsersSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.serviceExternalId}/users`
    return simpleStubBuilder('GET', path, 200, {
      response: userFixtures.validUsersResponse(opts.users)
    })
  },
  getInvitedUsersSuccess: (opts = {}) => {
    const path = '/v1/api/invites'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        serviceId: opts.serviceExternalId
      },
      response: inviteFixtures.validListInvitesResponse(opts.invites)
    })
  },
  getGatewayAccountSuccess: (opts = {}) => {
    const path = '/v1/frontend/accounts/' + opts.gateway_account_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validGatewayAccountResponse(opts)
    })
  },
  getGatewayAccountByExternalIdSuccess: (opts = {}) => {
    const path = '/v1/api/accounts/external-id/' + opts.external_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validGatewayAccountResponse(opts)
    })
  },
  getGatewayAccountSuccessRepeat: (opts = {}) => {
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[0])
    const aDifferentValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[1])
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/frontend/accounts/' + opts[0].gateway_account_id,
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aValidGetGatewayAccountResponse
          },
          _behaviors: {
            repeat: opts[0].repeat
          }
        }, {
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aDifferentValidGetGatewayAccountResponse
          },
          _behaviors: {
            repeat: opts[1].repeat
          }
        }]
      }
    ]
  },
  getGatewayAccountStripeSetupSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/stripe-setup`
    return simpleStubBuilder('GET', path, 200, {
      response: stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(opts)
    })
  },
  getGatewayAccountStripeSetupFlagChanged: (opts = {}) => {
    const responses = []
    opts.data.forEach(item => {
      responses.push({
        is: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(item)
        }
      })
    })

    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/accounts/${opts.gateway_account_id}/stripe-setup`,
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses
      }
    ]
  },
  getStripeAccountSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/stripe-account`
    return simpleStubBuilder('GET', path, 200, {
      response: stripeAccountFixtures.buildGetStripeAccountResponse(opts)
    })
  },
  getGatewayAccountsSuccess: (opts = {}) => {
    const path = '/v1/frontend/accounts'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        accountIds: opts.gateway_account_id.toString()
      },
      response: gatewayAccountFixtures.validGatewayAccountsResponse({ accounts: [opts] })
    })
  },
  getDirectDebitGatewayAccountSuccess: (opts = {}) => {
    const path = '/v1/api/accounts/' + opts.gateway_account_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validDirectDebitGatewayAccountResponse(opts)
    })
  },
  getAccountAuthSuccess: (opts = {}) => {
    const path = '/v1/frontend/auth/' + opts.gateway_account_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validGatewayAccountTokensResponse(opts)
    })
  },
  patchAccountEmailCollectionModeSuccess: (opts = {}) => {
    const path = '/v1/api/accounts/' + opts.gateway_account_id
    return simpleStubBuilder('PATCH', path, 200, {
      request: gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest(opts.collectionMode)
    })
  },
  patchConfirmationEmailToggleSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/email-notification`
    return simpleStubBuilder('PATCH', path, 200, {
      request: gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(opts.enabled)
    })
  },
  patchRefundEmailToggleSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/email-notification`
    return simpleStubBuilder('PATCH', path, 200, {
      request: gatewayAccountFixtures.validGatewayAccountEmailRefundToggleRequest(opts.enabled)
    })
  },
  postUserAuthenticateSuccess: (opts = {}) => {
    const path = '/v1/api/users/authenticate'
    return simpleStubBuilder('POST', path, 200, {
      request: userFixtures.validAuthenticateRequest(opts),
      response: userFixtures.validUserResponse(opts)
    })
  },
  postUserAuthenticateInvalidPassword: (opts = {}) => {
    const path = '/v1/api/users/authenticate'
    return simpleStubBuilder('POST', path, 401, {
      request: userFixtures.validAuthenticateRequest(opts),
      response: userFixtures.invalidPasswordAuthenticateResponse()
    })
  },
  postSecondFactorSuccess: (opts = {}) => {
    const path = `/v1/api/users/${opts.external_id}/second-factor`
    return simpleStubBuilder('POST', path, 200)
  },
  postRefundSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/refunds`
    return simpleStubBuilder('POST', path, 200, {
      request: transactionDetailsFixtures.validTransactionRefundRequest(opts),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postRefundAmountNotAvailable: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/refunds`
    return simpleStubBuilder('POST', path, 400, {
      request: transactionDetailsFixtures.validTransactionRefundRequest(opts),
      response: transactionDetailsFixtures.invalidTransactionRefundResponse({
        error_identifier: 'REFUND_NOT_AVAILABLE',
        reason: 'amount_not_available'
      })
    })
  },
  getLedgerTransactionSuccess: (opts = {}) => {
    const path = `/v1/transaction/${opts.transaction_id}`
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerTransactionFixtures.validTransactionDetailsResponse(opts)
    })
  },
  getLedgerPayoutSuccess: (opts = {}) => {
    const path = '/v1/payout'
    const { total, page } = opts
    return simpleStubBuilder('GET', path, 200, {
      query: {
        gateway_account_id: opts.gateway_account_id,
        state: 'paidout',
        page: opts.page || 1,
        display_size: opts.display_size || 15
      },
      response: ledgerPayoutFixtures.validPayoutSearchResponse(opts.payouts || [], { total, page })
    })
  },
  getLedgerEventsSuccess: (opts = {}) => {
    const path = `/v1/transaction/${opts.transaction_id}/event`
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerTransactionFixtures.validTransactionEventsResponse(opts)
    })
  },
  getLedgerTransactionsSuccess: (opts = {}) => {
    const path = '/v1/transaction'
    return simpleStubBuilder('GET', path, 200, {
      query: lodash.defaults(opts.filters, {
        account_id: opts.gateway_account_id,
        page: opts.page || 1,
        display_size: opts.display_size || 100,
        limit_total: true,
        limit_total_size: 5001
      }),
      response: ledgerTransactionFixtures.validTransactionSearchResponse(opts)
    })
  },
  getCardTypesSuccess: () => {
    const path = '/v1/api/card-types'
    return simpleStubBuilder('GET', path, 200, {
      response: cardFixtures.validCardTypesResponse()
    })
  },
  getAcceptedCardTypesSuccess: opts => {
    const path = `/v1/frontend/accounts/${opts.account_id}/card-types`
    const response = opts.updated
      ? cardFixtures.validUpdatedAcceptedCardTypesResponse()
      : cardFixtures.validAcceptedCardTypesResponse(opts)
    return simpleStubBuilder('GET', path, 200, { response: response })
  },
  getAcceptedCardsForAccountSuccess: opts => {
    const path = `/v1/frontend/accounts/${opts.account_id}/card-types`
    return simpleStubBuilder('GET', path, 200, {
      response: cardFixtures.validUpdatedAcceptedCardTypesResponse()
    })
  },
  patchUpdateServiceGoLiveStageSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: serviceFixtures.validUpdateRequestToGoLiveRequest(opts.current_go_live_stage),
      response: serviceFixtures.validServiceResponse(opts)
    })
  },
  patchUpdateMerchantDetailsSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: serviceFixtures.validUpdateMerchantDetailsRequest(opts.merchant_details),
      response: serviceFixtures.validServiceResponse(opts)
    })
  },
  patchUpdateServiceNameSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: serviceFixtures.validUpdateServiceNameRequest(opts.serviceName),
      response: serviceFixtures.validServiceResponse(opts),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  patchUpdateServiceSuccessCatchAll: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      response: serviceFixtures.validServiceResponse(opts)
    })
  },
  patchGoLiveStageFailure: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 404, {
      request: serviceFixtures.validUpdateServiceRequest(opts)
    })
  },
  postGovUkPayAgreement: (opts) => {
    const path = `/v1/api/services/${opts.external_id}/govuk-pay-agreement`
    return simpleStubBuilder('POST', path, 201, {
      request: goLiveRequestFixtures.validPostGovUkPayAgreementRequest(opts),
      response: goLiveRequestFixtures.validPostGovUkPayAgreementResponse(opts)
    })
  },
  postStripeAgreementIpAddress: (opts) => {
    const path = `/v1/api/services/${opts.external_id}/stripe-agreement`
    return simpleStubBuilder('POST', path, 201, {
      request: goLiveRequestFixtures.validPostStripeAgreementRequest(opts),
      responseHeaders: {}
    })
  },
  getProductsByGatewayAccountIdSuccess: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products`
    return simpleStubBuilder('GET', path, 200, {
      response: opts.products.map(product =>
        productFixtures.validProductResponse(product))
    })
  },
  getProductsByGatewayAccountIdFailure: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products`
    return simpleStubBuilder('GET', path, 500)
  },
  getProductByExternalIdSuccess: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products/${opts.product.external_id}`
    return simpleStubBuilder('GET', path, 200, {
      response: productFixtures.validProductResponse(opts.product)
    })
  },
  deleteProductSuccess: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products/${opts.product.external_id}`
    return simpleStubBuilder('DELETE', path, 200, {
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },

  patchUpdateMotoMaskSecurityCode: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: {
        op: 'replace',
        path: 'moto_mask_security_code_input',
        value: opts.motoMaskCardSecurityCode
      }
    })
  },

  patchUpdateMotoMaskCardNumber: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: {
        op: 'replace',
        path: 'moto_mask_card_number_input',
        value: opts.motoMaskCardNumber
      }
    })
  },
  patchUpdate3DS: (opts = {}) => {
    const path = `/v1/api/frontend/accounts/${opts.gateway_account_id}/3ds-toggle`
    // TODO: this should use a fixture to construct the request body
    return simpleStubBuilder('PATCH', path, 200, {
      request: {
        toggle_3ds: opts.enable
      }
    })
  },
  patchIntegrationVersion3ds: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: {
        op: 'replace',
        path: 'integration_version_3ds',
        value: opts.patchIntegrationVersion3ds
      }
    })
  },
  redirectToGoCardlessConnectFailure: (opts = {}) => {
    const path = '/oauth/authorize'
    return simpleStubBuilder('GET', path, 500, {
      responseHeaders: {}
    })
  },
  exchangeGoCardlessAccessCodeAccountAlreadyConnected: (opts = {}) => {
    const path = '/v1/api/gocardless/partnerapp/tokens'
    return simpleStubBuilder('POST', path, 400, {
      response: goCardlessConnectFixtures.exchangeAccessTokenAccountAlreadyConnectedResponse()
    })
  },
  getDashboardStatisticsStub: (opts = {}) => {
    const path = '/v1/report/transactions-summary'
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerFixture.validTransactionSummaryDetails(opts)
    })
  },
  patchUpdateCredentials: (opts = {}) => {
    const path = `/v1/api/frontend/accounts/${opts.gateway_account_id}/credentials`
    // TODO: this should use a fixture to construct the request body
    return simpleStubBuilder('PATCH', path, 200, {
      request: {
        credentials: {
          merchant_id: opts.merchantId,
          username: opts.username,
          password: opts.password
        }
      }
    })
  },
  patchUpdateFlexCredentials: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/3ds-flex-credentials`
    // TODO: this should use a fixture to construct the request body
    return simpleStubBuilder('POST', path, 200, {
      request: {
        organisational_unit_id: opts.unitId,
        issuer: opts.issuer,
        jwt_mac_key: opts.jwtKey
      }
    })
  },
  putUpdateServiceRoleSuccess: (opts = {}) => {
    const path = `/v1/api/users/${opts.external_id}/services/${opts.serviceExternalId}`
    return simpleStubBuilder('PUT', path, 200, {
      request: userFixtures.validUpdateServiceRoleRequest(opts.role),
      response: userFixtures.validUserResponse(opts)
    })
  },
  postAssignServiceRoleSuccess: (opts = {}) => {
    const path = `/v1/api/users/${opts.external_id}/services`
    return simpleStubBuilder('POST', path, 200, {
      request: userFixtures.validAssignServiceRoleRequest(opts),
      response: userFixtures.validUserResponse(opts),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postCreateGatewayAccountSuccess: (opts = {}) => {
    const path = '/v1/api/accounts'
    return simpleStubBuilder('POST', path, 200, {
      request: gatewayAccountFixtures.validCreateGatewayAccountRequest(opts),
      response: gatewayAccountFixtures.validGatewayAccountResponse(opts),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postCreateServiceSuccess: (opts = {}) => {
    const path = '/v1/api/services'
    return simpleStubBuilder('POST', path, 200, {
      request: serviceFixtures.validCreateServiceRequest(opts),
      response: serviceFixtures.validServiceResponse(opts),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postCreateTokenForAccountSuccess: (opts = {}) => {
    const path = '/v1/frontend/auth'
    return simpleStubBuilder('POST', path, 200, {
      response: tokenFixtures.validCreateTokenForGatewayAccountResponse()
    })
  },
  postCreateProductSuccess: (opts = {}) => {
    const path = '/v1/api/products'
    return simpleStubBuilder('POST', path, 200, {
      response: productFixtures.validProductResponse(opts)
    })
  },
  postCheckWorldpay3dsFlexCredentials: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/worldpay/check-3ds-flex-config`
    if (opts.shouldReturnValid) {
      return simpleStubBuilder('POST', path, 200, {
        request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest().payload,
        response: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsResponse()
      })
    } else {
      return simpleStubBuilder('POST', path, 200, {
        request: worldpay3dsFlexCredentialsFixtures.checkInvalidWorldpay3dsFlexCredentialsRequest().payload,
        response: worldpay3dsFlexCredentialsFixtures.checkInvalidWorldpay3dsFlexCredentialsResponse()
      })
    }
  },
  postCheckWorldpay3dsFlexCredentialsFailure: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/worldpay/check-3ds-flex-config`
    return simpleStubBuilder('POST', path, 500, {
      request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest(opts).payload
    })
  }
}
