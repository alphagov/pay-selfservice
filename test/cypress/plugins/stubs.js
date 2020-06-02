'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const userFixtures = require('../../fixtures/user_fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const transactionDetailsFixtures = require('../../fixtures/transaction_fixtures')
const ledgerTransactionFixtures = require('../../fixtures/ledger_transaction_fixtures')
const ledgerPayoutFixtures = require('../../fixtures/payout_fixtures')
const cardFixtures = require('../../fixtures/card_fixtures')
const serviceFixtures = require('../../fixtures/service_fixtures')
const goLiveRequestFixtures = require('../../fixtures/go_live_requests_fixture')
const stripeAccountSetupFixtures = require('../../fixtures/stripe_account_setup_fixtures')
const productFixtures = require('../../fixtures/product_fixtures')
const goCardlessConnectFixtures = require('../../fixtures/go_cardless_connect_fixtures')
const ledgerFixture = require('../../fixtures/ledger_transaction_fixtures')
const inviteFixtures = require('../../fixtures/invite_fixtures')

const simpleStubBuilder = function simpleStubBuilder (method, path, responseCode, additionalParams = {}) {
  const request = {
    method,
    path
  }
  if (additionalParams.request) {
    request.body = additionalParams.request
  }
  if (additionalParams.query) {
    request.query = additionalParams.query
  }

  const response = {
    statusCode: responseCode,
    headers: additionalParams.responseHeaders || { 'Content-Type': 'application/json' }
  }
  if (additionalParams.response) {
    response.body = additionalParams.response
  }

  const stub = {
    name: `${method} ${path} ${responseCode}`,
    predicates: [{
      deepEquals: request
    }],
    responses: [{
      is: response
    }]
  }

  // NOTE: if the "verifyCalledTimes" is specified, we will attempt to verify for all `it` blocks
  // the stub is setup for, and the counter is reset for every `it`.
  if (additionalParams.verifyCalledTimes) {
    stub.verifyCalledTimes = additionalParams.verifyCalledTimes
  }

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
      response: userFixtures.validUserResponse(opts).getPlain()
    })
  },
  getUsersSuccess: (opts = {}) => {
    const path = '/v1/api/users'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        ids: opts.userIds ? opts.userIds.join() : ''
      },
      response: userFixtures.validUsersResponse(opts.users).getPlain()
    })
  },
  getUserSuccessRepeatFirstResponseNTimes: (opts = {}) => {
    const aValidUserResponse = userFixtures.validUserResponse(opts[0]).getPlain()
    const aSecondValidUserResponse = userFixtures.validUserResponse(opts[1]).getPlain()
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
            repeat: opts[0].repeat
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
            repeat: opts[1].repeat
          }
        }
        ]
      }
    ]
  },
  getServiceUsersSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.serviceExternalId}/users`
    return simpleStubBuilder('GET', path, 200, {
      response: userFixtures.validUsersResponse(opts.users).getPlain()
    })
  },
  getInvitedUsersSuccess: (opts = {}) => {
    const path = '/v1/api/invites'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        serviceId: opts.serviceExternalId
      },
      response: inviteFixtures.validListInvitesResponse(opts.invites).getPlain()
    })
  },
  getGatewayAccountSuccess: (opts = {}) => {
    const path = '/v1/frontend/accounts/' + opts.gateway_account_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validGatewayAccountResponse(opts).getPlain()
    })
  },
  getGatewayAccountSuccessRepeat: (opts = {}) => {
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[0]).getPlain()
    const aDifferentValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[1]).getPlain()
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
      response: stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(opts).getPlain()
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
          body: stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(item).getPlain()
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
      response: stripeAccountSetupFixtures.buildGetStripeAccountResponse(opts).getPlain()
    })
  },
  getGatewayAccountsSuccess: (opts = {}) => {
    const path = '/v1/frontend/accounts'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        accountIds: opts.gateway_account_id.toString()
      },
      response: gatewayAccountFixtures.validGatewayAccountsResponse({ accounts: [opts] }).getPlain()
    })
  },
  getGatewayAccountSuccessRepeatNTimes: (opts = {}) => {
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[0]).getPlain()
    const aSecondValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts[1]).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/frontend/accounts/${opts[0].gateway_account_id}`,
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
            repeat: 1
          }
        }, {
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aSecondValidGetGatewayAccountResponse
          },
          _behaviors: {
            repeat: 1
          }
        }]
      }
    ]
  },
  getDirectDebitGatewayAccountSuccess: (opts = {}) => {
    const path = '/v1/api/accounts/' + opts.gateway_account_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validDirectDebitGatewayAccountResponse(opts).getPlain()
    })
  },
  getAccountAuthSuccess: (opts = {}) => {
    const path = '/v1/frontend/auth/' + opts.gateway_account_id
    return simpleStubBuilder('GET', path, 200, {
      response: gatewayAccountFixtures.validGatewayAccountTokensResponse(opts).getPlain()
    })
  },
  patchAccountEmailCollectionModeSuccess: (opts = {}) => {
    const path = '/v1/api/accounts/' + opts.gateway_account_id
    return simpleStubBuilder('PATCH', path, 200, {
      request: gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest(opts.collectionMode).getPlain()
    })
  },
  patchConfirmationEmailToggleSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/email-notification`
    return simpleStubBuilder('PATCH', path, 200, {
      request: gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(opts.enabled).getPlain()
    })
  },
  patchRefundEmailToggleSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/email-notification`
    return simpleStubBuilder('PATCH', path, 200, {
      request: gatewayAccountFixtures.validGatewayAccountEmailRefundToggleRequest(opts.enabled).getPlain()
    })
  },
  postUserAuthenticateSuccess: (opts = {}) => {
    const path = '/v1/api/users/authenticate'
    return simpleStubBuilder('POST', path, 200, {
      request: userFixtures.validAuthenticateRequest(opts).getPlain(),
      response: userFixtures.validUserResponse(opts).getPlain()
    })
  },
  postUserAuthenticateInvalidPassword: (opts = {}) => {
    const path = '/v1/api/users/authenticate'
    return simpleStubBuilder('POST', path, 401, {
      request: userFixtures.validAuthenticateRequest(opts).getPlain(),
      response: userFixtures.invalidPasswordAuthenticateResponse().getPlain()
    })
  },
  postSecondFactorSuccess: (opts = {}) => {
    const path = `/v1/api/users/${opts.external_id}/second-factor`
    return simpleStubBuilder('POST', path, 200)
  },
  getChargeSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.chargeDetails.charge_id}`
    return simpleStubBuilder('GET', path, 200, {
      response: transactionDetailsFixtures.validTransactionDetailsResponse(opts.chargeDetails).getPlain()
    })
  },
  getChargeEventsSuccess: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/events`
    return simpleStubBuilder('GET', path, 200, {
      response: transactionDetailsFixtures.validChargeEventsResponse(opts).getPlain()
    })
  },
  postRefundAmountNotAvailable: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/refunds`
    return simpleStubBuilder('POST', path, 400, {
      request: transactionDetailsFixtures.validTransactionRefundRequest(opts).getPlain(),
      response: transactionDetailsFixtures.invalidTransactionRefundResponse({ reason: 'amount_not_available' }).getPlain()
    })
  },
  getLedgerTransactionSuccess: (opts = {}) => {
    const path = `/v1/transaction/${opts.transaction_id}`
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerTransactionFixtures.validTransactionDetailsResponse(opts).getPlain()
    })
  },
  getLedgerPayoutSuccess: (opts = {}) => {
    const path = '/v1/payout'
    const { total, page } = opts
    return simpleStubBuilder('GET', path, 200, {
      query: {
        gateway_account_id: opts.gateway_account_id,
        page: opts.page || 1,
        display_size: opts.display_size || 15
      },
      response: ledgerPayoutFixtures.validPayoutSearchResponse(opts.payouts || [], { total, page }).getPlain()
    })
  },
  getLedgerEventsSuccess: (opts = {}) => {
    const path = `/v1/transaction/${opts.transaction_id}/event`
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerTransactionFixtures.validTransactionEventsResponse(opts).getPlain()
    })
  },
  getLedgerTransactionsSuccess: (opts = {}) => {
    const path = '/v1/transaction'
    return simpleStubBuilder('GET', path, 200, {
      query: lodash.defaults(opts.filters, {
        account_id: opts.gateway_account_id,
        with_parent_transaction: true,
        page: opts.page || 1,
        display_size: opts.display_size || 100
      }),
      response: ledgerTransactionFixtures.validTransactionSearchResponse(opts).getPlain()
    })
  },
  getCardTypesSuccess: () => {
    const path = '/v1/api/card-types'
    return simpleStubBuilder('GET', path, 200, {
      response: cardFixtures.validCardTypesResponse().getPlain()
    })
  },
  getAcceptedCardTypesSuccess: opts => {
    const path = `/v1/frontend/accounts/${opts.account_id}/card-types`
    const response = opts.updated
      ? cardFixtures.validUpdatedAcceptedCardTypesResponse().getPlain()
      : cardFixtures.validAcceptedCardTypesResponse(opts).getPlain()
    return simpleStubBuilder('GET', path, 200, { response: response })
  },
  getAcceptedCardsForAccountSuccess: opts => {
    const path = `/v1/frontend/accounts/${opts.account_id}/card-types`
    return simpleStubBuilder('GET', path, 200, {
      response: cardFixtures.validUpdatedAcceptedCardTypesResponse().getPlain()
    })
  },
  patchUpdateServiceGoLiveStageSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: serviceFixtures.validUpdateRequestToGoLiveRequest(opts.current_go_live_stage).getPlain(),
      response: serviceFixtures.validServiceResponse(opts).getPlain()
    })
  },
  patchUpdateMerchantDetailsSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: serviceFixtures.validUpdateMerchantDetailsRequest(opts.merchant_details).getPlain(),
      response: serviceFixtures.validServiceResponse(opts).getPlain()
    })
  },
  patchUpdateServiceNameSuccess: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      request: serviceFixtures.validUpdateServiceNameRequest(opts.serviceName).getPlain(),
      response: serviceFixtures.validServiceResponse(opts).getPlain(),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  patchUpdateServiceSuccessCatchAll: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 200, {
      response: serviceFixtures.validServiceResponse(opts).getPlain()
    })
  },
  patchGoLiveStageFailure: (opts = {}) => {
    const path = `/v1/api/services/${opts.external_id}`
    return simpleStubBuilder('PATCH', path, 404, {
      request: serviceFixtures.validUpdateServiceRequest(opts).getPlain()
    })
  },
  postGovUkPayAgreement: (opts) => {
    const path = `/v1/api/services/${opts.external_id}/govuk-pay-agreement`
    return simpleStubBuilder('POST', path, 201, {
      request: goLiveRequestFixtures.validPostGovUkPayAgreementRequest(opts).getPlain(),
      response: goLiveRequestFixtures.validPostGovUkPayAgreementResponse(opts).getPlain()
    })
  },
  postStripeAgreementIpAddress: (opts) => {
    const path = `/v1/api/services/${opts.external_id}/stripe-agreement`
    return simpleStubBuilder('POST', path, 201, {
      request: goLiveRequestFixtures.validPostStripeAgreementRequest(opts).getPlain(),
      responseHeaders: {}
    })
  },
  getProductsByGatewayAccountIdSuccess: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products`
    return simpleStubBuilder('GET', path, 200, {
      response: opts.products.map(product =>
        productFixtures.validProductResponse(product).getPlain())
    })
  },
  getProductsByGatewayAccountIdFailure: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products`
    return simpleStubBuilder('GET', path, 500)
  },
  getProductByExternalIdSuccess: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products/${opts.product.external_id}`
    return simpleStubBuilder('GET', path, 200, {
      response: productFixtures.validProductResponse(opts.product).getPlain()
    })
  },
  deleteProductSuccess: (opts) => {
    const path = `/v1/api/gateway-account/${opts.gateway_account_id}/products/${opts.product.external_id}`
    return simpleStubBuilder('DELETE', path, 200, {
      verifyCalledTimes: opts.verifyCalledTimes
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
      response: ledgerFixture.validTransactionSummaryDetails(opts).getPlain()
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
      request: userFixtures.validUpdateServiceRoleRequest(opts.role).getPlain(),
      response: userFixtures.validUserResponse(opts).getPlain()
    })
  },
  postAssignServiceRoleSuccess: (opts = {}) => {
    const path = `/v1/api/users/${opts.external_id}/services`
    return simpleStubBuilder('POST', path, 200, {
      request: userFixtures.validAssignServiceRoleRequest(opts).getPlain(),
      response: userFixtures.validUserResponse(opts).getPlain(),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postCreateGatewayAccountSuccess: (opts = {}) => {
    const path = '/v1/api/accounts'
    return simpleStubBuilder('POST', path, 200, {
      request: gatewayAccountFixtures.validCreateGatewayAccountRequest(opts).getPlain(),
      response: gatewayAccountFixtures.validGatewayAccountResponse(opts).getPlain(),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  },
  postCreateServiceSuccess: (opts = {}) => {
    const path = '/v1/api/services'
    return simpleStubBuilder('POST', path, 200, {
      request: serviceFixtures.validCreateServiceRequest(opts).getPlain(),
      response: serviceFixtures.validServiceResponse(opts).getPlain(),
      verifyCalledTimes: opts.verifyCalledTimes
    })
  }
}
