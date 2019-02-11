'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const userFixtures = require('../../fixtures/user_fixtures')
const gatewayAccountFixtures = require('../../fixtures/gateway_account_fixtures')
const transactionDetailsFixtures = require('../../fixtures/transaction_fixtures')
const cardFixtures = require('../../fixtures/card_fixtures')
const serviceFixtures = require('../../fixtures/service_fixtures')
const goLiveRequestFixtures = require('../../fixtures/go_live_requests_fixture')

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
  getTransactionsSuccess: (opts = {}) => {
    const validGetTransactionsResponse = transactionDetailsFixtures.validTransactionsResponse(opts).getPlain()
    lodash.defaults(opts.filters, {
      reference: '',
      cardholder_name: '',
      last_digits_card_number: '',
      email: '',
      card_brand: '',
      from_date: '',
      to_date: '',
      page: '1',
      display_size: '100'
    })

    return [
      {
        predicates: [{
          equals: {
            method: 'GET',
            path: `/v2/api/accounts/${opts.gateway_account_id}/charges`,
            headers: {
              'Accept': 'application/json'
            },
            query: opts.filters
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
  patchUpdateServiceSuccess: (opts = {}) => {
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
  patchSingleMerchantDetailsSuccess: (opts = {}) => {
    return [
      {
        predicates: [{
          equals: {
            method: 'PATCH',
            path: `/v1/api/services/${opts.external_id}`,
            headers: {
              'Accept': 'application/json'
            },
            body: serviceFixtures.validUpdateMerchantNameRequest(opts.value).getPlain()
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
            path: `v1/api/services/${opts.external_id}/govuk-pay-agreement`,
            headers: {
              'Accept': 'application/json'
            },
            body: goLiveRequestFixtures.validPostGovUkPayAgreementRequest(opts)
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
  }
}
