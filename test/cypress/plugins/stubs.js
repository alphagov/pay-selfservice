'use strict'

const lodash = require('lodash')

const gatewayAccountFixtures = require('../../fixtures/gateway-account.fixtures')
const transactionDetailsFixtures = require('../../fixtures/refund.fixtures')
const ledgerTransactionFixtures = require('../../fixtures/ledger-transaction.fixtures')
const ledgerPayoutFixtures = require('../../fixtures/payout.fixtures')
const cardFixtures = require('../../fixtures/card.fixtures')
const goLiveRequestFixtures = require('../../fixtures/go-live-requests.fixture')
const productFixtures = require('../../fixtures/product.fixtures')
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
  getInvitedUsersSuccess: (opts = {}) => {
    const path = '/v1/api/invites'
    return simpleStubBuilder('GET', path, 200, {
      query: {
        serviceId: opts.serviceExternalId
      },
      response: inviteFixtures.validListInvitesResponse(opts.invites)
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
  getAcceptedCardsForAccountSuccess: opts => {
    const path = `/v1/frontend/accounts/${opts.account_id}/card-types`
    return simpleStubBuilder('GET', path, 200, {
      response: cardFixtures.validUpdatedAcceptedCardTypesResponse()
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
  redirectToGoCardlessConnectFailure: (opts = {}) => {
    const path = '/oauth/authorize'
    return simpleStubBuilder('GET', path, 500, {
      responseHeaders: {}
    })
  },
  getDashboardStatisticsStub: (opts = {}) => {
    const path = '/v1/report/transactions-summary'
    return simpleStubBuilder('GET', path, 200, {
      response: ledgerFixture.validTransactionSummaryDetails(opts)
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
  postCheckWorldpay3dsFlexCredentialsFailure: (opts = {}) => {
    const path = `/v1/api/accounts/${opts.gateway_account_id}/worldpay/check-3ds-flex-config`
    return simpleStubBuilder('POST', path, 500, {
      request: worldpay3dsFlexCredentialsFixtures.checkValidWorldpay3dsFlexCredentialsRequest(opts).payload
    })
  }
}
