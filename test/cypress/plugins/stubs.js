'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const userFixtures = require('../../fixtures/user_fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const transactionDetailsFixtures = require('../../fixtures/transaction_fixtures')
const ledgerTransactionFixtures = require('../../fixtures/ledger_transaction_fixtures')
const cardFixtures = require('../../fixtures/card_fixtures')
const serviceFixtures = require('../../fixtures/service_fixtures')
const goLiveRequestFixtures = require('../../fixtures/go_live_requests_fixture')
const stripeAccountSetupFixtures = require('../../fixtures/stripe_account_setup_fixtures')
const productFixtures = require('../../fixtures/product_fixtures')
const goCardlessConnectFixtures = require('../../fixtures/go_cardless_connect_fixtures')
const ledgerFixture = require('../../fixtures/ledger_transaction_fixtures')

/**
 * Stub definitions added here should always use fixture builders to generate request and response bodys.
 * The fixture builders used should be validated by also being used in the pact tests for the API endpoint, and they
 * should be written in a strict enough way the JSON they produce will adhere to a validated structure.
 */
module.exports = {
  getUserSuccess: (opts = {}) => {
    const aValidUserResponse = userFixtures.validUserResponse(opts).getPlain()
    return [
      {
        predicates: [{
          deepEquals: {
            method: 'GET',
            path: '/v1/api/users/' + aValidUserResponse.external_id
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aValidUserResponse
          }
        }]
      }
    ]
  },
  getUsersSuccess: (opts = {}) => {
    const aValidUserResponse = userFixtures.validUsersResponse(opts).getPlain()
    const query = opts.userIds ? opts.userIds.join() : ''
    return [
      {
        predicates: [{
          deepEquals: {
            method: 'GET',
            path: '/v1/api/users',
            query: {
              ids: query
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
          }
        }]
      }
    ]
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
  getGatewayAccountSuccess: (opts = {}) => {
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/frontend/accounts/' + opts.gateway_account_id,
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
          }
        }]
      }
    ]
  },
  getGatewayAccountStripeSetupSuccess: (opts = {}) => {
    const aValidGetGatewayAccountStripeSetupResponse = stripeAccountSetupFixtures.buildGetStripeAccountSetupResponse(opts).getPlain()
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
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aValidGetGatewayAccountStripeSetupResponse
          }
        }]
      }
    ]
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
    const aValidGetStripeAccountResponse = stripeAccountSetupFixtures.buildGetStripeAccountResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/accounts/${opts.gateway_account_id}/stripe-account`,
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
            body: aValidGetStripeAccountResponse
          }
        }]
      }
    ]
  },
  getGatewayAccountQueryParamsSuccess: (opts = {}) => {
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validGatewayAccountResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/frontend/accounts',
            query: { accountIds: opts.gateway_account_id.toString() },
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
          }
        }]
      }
    ]
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
    const aValidGetGatewayAccountResponse = gatewayAccountFixtures.validDirectDebitGatewayAccountResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/api/accounts/' + opts.gateway_account_id,
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
          }
        }]
      }
    ]
  },
  getAccountAuthSuccess: (opts = {}) => {
    const getServiceAuthResponse = gatewayAccountFixtures.validGatewayAccountTokensResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/frontend/auth/' + opts.gateway_account_id,
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
            body: getServiceAuthResponse
          }
        }]
      }
    ]
  },
  patchAccountEmailCollectionModeSuccess: (opts = {}) => {
    const validGatewayAccountEmailCollectionModeRequest = gatewayAccountFixtures.validGatewayAccountEmailCollectionModeRequest(opts.collectionMode).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: '/v1/api/accounts/' + opts.gateway_account_id,
            headers: {
              'Accept': 'application/json'
            },
            body: validGatewayAccountEmailCollectionModeRequest
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  patchConfirmationEmailToggleSuccess: (opts = {}) => {
    const validGatewayAccountEmailConfirmationToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailConfirmationToggleRequest(opts.enabled).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/accounts/${opts.gateway_account_id}/email-notification`,
            headers: {
              'Accept': 'application/json'
            },
            body: validGatewayAccountEmailConfirmationToggleRequest
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  patchRefundEmailToggleSuccess: (opts = {}) => {
    const validGatewayAccountEmailRefundToggleRequest = gatewayAccountFixtures.validGatewayAccountEmailRefundToggleRequest(opts.enabled).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/accounts/${opts.gateway_account_id}/email-notification`,
            headers: {
              'Accept': 'application/json'
            },
            body: validGatewayAccountEmailRefundToggleRequest
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  postUserAuthenticateSuccess: (opts = {}) => {
    const aValidAuthenticateRequest = userFixtures.validAuthenticateRequest(opts).getPlain()
    const aValidAuthenticateResponse = userFixtures.validUserResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: '/v1/api/users/authenticate',
            headers: {
              'Accept': 'application/json'
            },
            body: aValidAuthenticateRequest
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: aValidAuthenticateResponse
          }
        }]
      }
    ]
  },
  postUserAuthenticateInvalidPassword: (opts = {}) => {
    const aValidAuthenticateRequest = userFixtures.validAuthenticateRequest(opts).getPlain()
    const invalidPasswordResponse = userFixtures.invalidPasswordAuthenticateResponse().getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: '/v1/api/users/authenticate',
            headers: {
              'Accept': 'application/json'
            },
            body: aValidAuthenticateRequest
          }
        }],
        responses: [{
          is: {
            statusCode: 401,
            headers: {
              'Content-Type': 'application/json'
            },
            body: invalidPasswordResponse
          }
        }]
      }
    ]
  },
  postSecondFactorSuccess: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: `/v1/api/users/${opts.external_id}/second-factor`,
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
            }
          }
        }]
      }
    ]
  },
  getChargeSuccess: (opts = {}) => {
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validTransactionDetailsResponse(opts.chargeDetails).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.chargeDetails.charge_id}`,
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
            body: validGetTransactionDetailsResponse
          }
        }]
      }
    ]
  },
  getChargeEventsSuccess: (opts = {}) => {
    const validGetTransactionDetailsResponse = transactionDetailsFixtures.validChargeEventsResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/events`,
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
            body: validGetTransactionDetailsResponse
          }
        }]
      }
    ]
  },
  postRefundAmountNotAvailable: (opts = {}) => {
    const invalidTransactionRefundRequest = transactionDetailsFixtures.validTransactionRefundRequest(opts).getPlain()
    const invalidTransactionRefundResponse = transactionDetailsFixtures.invalidTransactionRefundResponse({ reason: 'amount_not_available' }).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: `/v1/api/accounts/${opts.gateway_account_id}/charges/${opts.charge_id}/refunds`,
            headers: {
              'Accept': 'application/json'
            },
            body: invalidTransactionRefundRequest
          }
        }],
        responses: [{
          is: {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json'
            },
            body: invalidTransactionRefundResponse
          }
        }]
      }
    ]
  },
  getLedgerTransactionSuccess: (opts = {}) => {
    const validTransaction = ledgerTransactionFixtures.validTransactionDetailsResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/transaction/${opts.transaction_id}`
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: validTransaction
          }
        }]
      }
    ]
  },
  getLedgerEventsSuccess: (opts = {}) => {
    const validEvents = ledgerTransactionFixtures.validTransactionEventsResponse(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/transaction/${opts.transaction_id}/event`
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: validEvents
          }
        }]
      }
    ]
  },
  getLedgerTransactionsSuccess: (opts = {}) => {
    const validGetTransactionsResponse = ledgerTransactionFixtures.validTransactionSearchResponse(opts).getPlain()
    const query = lodash.defaults(opts.filters, {
      account_id: opts.gateway_account_id,
      with_parent_transaction: true,
      page: 1,
      display_size: 100
    })

    return [
      {
        predicates: [{
          deepEquals: {
            method: 'GET',
            path: '/v1/transaction',
            query
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: validGetTransactionsResponse
          }
        }]
      }
    ]
  },
  getCardTypesSuccess: () => {
    const validCardTypesResponse = cardFixtures.validCardTypesResponse().getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/api/card-types',
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
            body: validCardTypesResponse
          }
        }]
      }
    ]
  },
  getAcceptedCardTypesSuccess: opts => {
    const validAcceptedCardTypesResponse = cardFixtures.validAcceptedCardTypesResponse(opts).getPlain()
    const validUpdatedAcceptedCardTypesResponse = cardFixtures.validUpdatedAcceptedCardTypesResponse().getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/frontend/accounts/${opts.account_id}/card-types`,
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
            body: opts.updated ? validUpdatedAcceptedCardTypesResponse : validAcceptedCardTypesResponse
          }
        }]
      }
    ]
  },
  postAcceptedCardsForAccountSuccess: opts => {
    const validUpdatedAcceptedCardTypesResponse = cardFixtures.validUpdatedAcceptedCardTypesResponse().getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/frontend/accounts/${opts.account_id}/card-types`,
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
            body: validUpdatedAcceptedCardTypesResponse
          }
        }]
      }
    ]
  },
  patchUpdateServiceGoLiveStageSuccess: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/services/${opts.external_id}`,
            headers: {
              'Accept': 'application/json'
            },
            body: serviceFixtures.validUpdateRequestToGoLiveRequest(opts.current_go_live_stage).getPlain()
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            body: serviceFixtures.validServiceResponse(opts).getPlain(),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  patchUpdateMerchantDetailsSuccess: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/services/${opts.external_id}`,
            headers: {
              'Accept': 'application/json'
            },
            body: serviceFixtures.validUpdateMerchantDetailsRequest(opts.merchant_details).getPlain()
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            body: serviceFixtures.validServiceResponse(opts).getPlain(),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  patchUpdateServiceSuccessCatchAll: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/services/${opts.external_id}`,
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            body: serviceFixtures.validServiceResponse(opts).getPlain(),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  patchGoLiveStageFailure: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/services/${opts.external_id}`,
            headers: {
              'Accept': 'application/json'
            },
            body: serviceFixtures.validUpdateServiceRequest(opts).getPlain()
          }
        }],
        responses: [{
          is: {
            statusCode: 404,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  postGovUkPayAgreement: (opts) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: `/v1/api/services/${opts.external_id}/govuk-pay-agreement`,
            headers: {
              'Accept': 'application/json'
            },
            body: goLiveRequestFixtures.validPostGovUkPayAgreementRequest(opts).getPlain()
          }
        }],
        responses: [{
          is: {
            statusCode: 201,
            body: goLiveRequestFixtures.validPostGovUkPayAgreementResponse(opts).getPlain(),
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  postStripeAgreementIpAddress: (opts) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: `/v1/api/services/${opts.external_id}/stripe-agreement`,
            headers: {
              'Accept': 'application/json'
            },
            body: goLiveRequestFixtures.validPostStripeAgreementRequest(opts).getPlain()
          }
        }],
        responses: [{
          is: {
            statusCode: 201,
            headers: {}
          }
        }]
      }
    ]
  },
  getProductsByGatewayAccountIdSuccess: (opts) => {
    const response = opts.products.map(product =>
      productFixtures.validCreateProductResponse(product).getPlain())

    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/gateway-account/${opts.gateway_account_id}/products`,
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
            body: response
          }
        }]
      }
    ]
  },
  getProductsByGatewayAccountIdFailure: (opts) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/gateway-account/${opts.gateway_account_id}/products`,
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  getProductByExternalIdSuccess: (opts) => {
    const response = productFixtures.validCreateProductResponse(opts.product).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v1/api/gateway-account/${opts.gateway_account_id}/products/${opts.product.external_id}`,
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
            body: response
          }
        }]
      }
    ]
  },
  patchUpdate3DS: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/frontend/accounts/${opts.gateway_account_id}/3ds-toggle`,
            headers: {
              'Accept': 'application/json'
            },
            body: {
              toggle_3ds: opts.enable
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }]
      }
    ]
  },
  redirectToGoCardlessConnectFailure: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/oauth/authorize`,
            headers: {
              'Accept': 'text/html'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 500
          }
        }]
      }
    ]
  },
  exchangeGoCardlessAccessCodeAccountAlreadyConnected: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'POST',
            path: '/v1/api/gocardless/partnerapp/tokens',
            headers: {
              'Accept': 'application/json'
            }
          }
        }],
        responses: [{
          is: {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json'
            },
            body: goCardlessConnectFixtures.exchangeAccessTokenAccountAlreadyConnectedResponse()
          }
        }]
      }
    ]
  },
  getDashboardStatisticsStub: (opts = {}) => {
    const body = ledgerFixture.validTransactionSummaryDetails(opts).getPlain()
    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: '/v1/report/transactions-summary',
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
            body: body
          }
        }]
      }
    ]
  }
}
