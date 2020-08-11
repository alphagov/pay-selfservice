'use strict'

const lodash = require('lodash')
const userStubs = require('../../utils/user-stubs')

const capitalise = string => string[0].toUpperCase() + string.slice(1)
const convertPenceToPoundsFormatted = pence => `£${(pence / 100).toFixed(2)}`
const defaultAmount = 1000
const transactionId = 'adb123def456'
const gatewayAccountId = 42
const serviceName = 'Test Service'

function formatDate (date) {
  const monthNames = [
    'Jan', 'Feb', 'Mar',
    'Apr', 'May', 'Jun', 'Jul',
    'Aug', 'Sep', 'Oct',
    'Nov', 'Dec'
  ]

  let day = date.getDate()
  day = day.toString().length > 1 ? day : '0' + day
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' — '
}

const defaultTransactionEvents = [{
  amount: defaultAmount,
  state: {
    finished: false,
    status: 'created'
  },
  resource_type: 'PAYMENT',
  event_type: 'PAYMENT_CREATED',
  timestamp: '2019-09-18T10:06:17.152Z',
  data: {}
}]

function defaultTransactionDetails (events, opts = {}) {
  return {
    amount: defaultAmount,
    state: { finished: true, status: 'success' },
    description: 'description',
    reference: 'ref188888',
    transaction_id: transactionId,
    email: 'j.doe@example.org',
    payment_provider: 'sandbox',
    created_date: '2018-05-01T13:27:00.057Z',
    delayed_capture: false,
    transaction_type: 'PAYMENT',
    account_id: gatewayAccountId,
    refund_summary_status: opts.refund_summary_status || 'available',
    refund_summary_available: opts.refund_amount_available || defaultAmount,
    refund_summary_submitted: opts.refund_summary_submitted || 0,
    gateway_transaction_id: 'a-gateway-transaction-id',
    cardholder_name: 'J Doe',
    card_brand: 'Visa',
    last_digits_card_number: '0002',
    expiry_date: '08/23',
    includeRefundSummary: true,
    includeSearchResultCardDetails: true,
    includeAddress: opts.includeAddress || true,
    events: events || defaultTransactionEvents
  }
}

describe('Transaction details page', () => {
  const transactionsUrl = `/transactions`
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const userEmail = 'a-user@example.com'

  const getStubs = (transactionDetails, additionalGatewayAccountOpts = {}) => {
    return [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, email: userEmail }),
      userStubs.getUsersSuccess(),
      {
        name: 'getGatewayAccountSuccess',
        opts: {
          ...additionalGatewayAccountOpts,
          gateway_account_id: gatewayAccountId,
          payment_provider: transactionDetails.payment_provider
        }
      },
      {
        name: 'getLedgerTransactionSuccess',
        opts: {
          ...transactionDetails
        }
      },
      {
        name: 'getLedgerEventsSuccess',
        opts: {
          transaction_id: transactionId,
          payment_states: transactionDetails.events
        }
      },
      {
        name: 'getGatewayAccountStripeSetupSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          bank_account: true,
          responsible_person: true,
          vat_number: true,
          company_number: true
        }
      }
    ]
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('page content', () => {
    it('should display transaction details correctly when delayed capture is OFF', () => {
      const transactionDetails = defaultTransactionDetails()
      cy.task('setupStubs', getStubs(transactionDetails))

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Ensure page details match up
      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        transactionDetails.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(transactionDetails.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('contain',
        formatDate(new Date(transactionDetails.events[0].timestamp)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        capitalise(transactionDetails.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('have.text',
        transactionDetails.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        transactionDetails.transaction_id)
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        transactionDetails.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        transactionDetails.cardholder_name)
      // // Card number
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        `**** **** **** ${transactionDetails.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        transactionDetails.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        transactionDetails.email)
      cy.get('#delayed-capture').should('not.exist')
    })

    it('should display transaction details correctly when delayed capture is ON', () => {
      const aDelayedCaptureTransaction = defaultTransactionDetails()
      aDelayedCaptureTransaction.delayed_capture = true
      cy.task('setupStubs', getStubs(aDelayedCaptureTransaction))

      cy.visit(`${transactionsUrl}/${aDelayedCaptureTransaction.transaction_id}`)

      // Ensure page details match up
      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        aDelayedCaptureTransaction.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(aDelayedCaptureTransaction.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(aDelayedCaptureTransaction.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(aDelayedCaptureTransaction.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('contain',
        formatDate(new Date(aDelayedCaptureTransaction.events[0].timestamp)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        capitalise(aDelayedCaptureTransaction.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('have.text',
        aDelayedCaptureTransaction.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        aDelayedCaptureTransaction.transaction_id)
      // Delayed capture
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        'On')
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        aDelayedCaptureTransaction.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        aDelayedCaptureTransaction.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        `**** **** **** ${aDelayedCaptureTransaction.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        aDelayedCaptureTransaction.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(14).find('td').first().should('have.text',
        aDelayedCaptureTransaction.email)
    })

    it('should display corporate card surcharge in the amount field correctly when there is a corporate card surcharge', () => {
      const aCorporateCardSurchargeTransaction = defaultTransactionDetails()
      aCorporateCardSurchargeTransaction.corporate_card_surcharge = 250
      aCorporateCardSurchargeTransaction.total_amount = 1250
      cy.task('setupStubs', getStubs(aCorporateCardSurchargeTransaction))

      cy.visit(`${transactionsUrl}/${aCorporateCardSurchargeTransaction.transaction_id}`)

      // Ensure page details match up
      // Amount
      cy.get('#amount').should('have.text',
        `${convertPenceToPoundsFormatted(aCorporateCardSurchargeTransaction.total_amount)} (including a card fee of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeTransaction.corporate_card_surcharge)})`)
    })

    it('should show a transaction when no card details are present ', function () {
      const events = [{
        event_type: 'PAYMENT_CREATED',
        status: 'created',
        finished: false,
        amount: '20000',
        timestamp: '2018-12-24 13:21:05'
      }]
      const opts = {
        includeAddress: false
      }

      const transactionDetails = defaultTransactionDetails(events, opts)
      cy.task('setupStubs', getStubs(transactionDetails))

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Ensure page details match up
      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        transactionDetails.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(transactionDetails.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(transactionDetails.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('contain',
        formatDate(new Date(transactionDetails.events[0].timestamp)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        capitalise(transactionDetails.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('have.text',
        transactionDetails.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        transactionDetails.transaction_id)
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        transactionDetails.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        transactionDetails.cardholder_name)
      // // Card number
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        `**** **** **** ${transactionDetails.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        transactionDetails.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        transactionDetails.email)
      cy.get('#delayed-capture').should('not.exist')
    })
  })

  describe('the transaction history endpoint', () => {
    it('should show a list of transaction history for success', function () {
      const events = [{
        event_type: 'PAYMENT_CREATED',
        status: 'created',
        finished: false,
        amount: '20000',
        timestamp: '2018-12-24 13:21:05'
      }, {
        event_type: 'PAYMENT_STARTED',
        status: 'started',
        finished: false,
        amount: '20000',
        timestamp: '2018-12-24 13:23:12'
      }, {
        event_type: 'AUTHORISATION_SUCCEEDED',
        status: 'submitted',
        finished: false,
        amount: '20000',
        timestamp: '2018-12-24 12:05:43'
      }, {
        event_type: 'USER_APPROVED_FOR_CAPTURE',
        status: 'success',
        finished: true,
        amount: '20000',
        timestamp: '2018-12-24 12:05:43'
      }]
      const transactionDetails = defaultTransactionDetails(events)
      cy.task('setupStubs', getStubs(transactionDetails))

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      cy.get('.transaction-events tbody').find('tr').eq(0).find('td').eq(0).should('contain',
        capitalise(events[3].status))
      cy.get('.transaction-events tbody').find('tr').eq(0).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[3].amount))
      cy.get('.transaction-events tbody').find('tr').eq(0).find('td').eq(2).should('contain',
        formatDate(new Date(events[3].timestamp)))
      cy.get('.transaction-events tbody').find('tr').eq(1).find('td').eq(0).should('contain',
        capitalise(events[2].status))
      cy.get('.transaction-events tbody').find('tr').eq(1).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[2].amount))
      cy.get('.transaction-events tbody').find('tr').eq(1).find('td').eq(2).should('contain',
        formatDate(new Date(events[2].timestamp)))
      cy.get('.transaction-events tbody').find('tr').eq(2).find('td').eq(0).should('contain',
        capitalise(events[1].status))
      cy.get('.transaction-events tbody').find('tr').eq(2).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[1].amount))
      cy.get('.transaction-events tbody').find('tr').eq(2).find('td').eq(2).should('contain',
        formatDate(new Date(events[1].timestamp)))
      cy.get('.transaction-events tbody').find('tr').eq(3).find('td').eq(0).should('contain',
        capitalise(events[0].status))
      cy.get('.transaction-events tbody').find('tr').eq(3).find('td').eq(1).should('contain',
        convertPenceToPoundsFormatted(events[0].amount))
      cy.get('.transaction-events tbody').find('tr').eq(3).find('td').eq(2).should('contain',
        formatDate(new Date(events[0].timestamp)))
    })
  })

  describe('refunds', () => {
    it('should fail when an invalid refund amount is specified', () => {
      const transactionDetails = defaultTransactionDetails()
      const refundAmount = transactionDetails.amount + 1
      const stubs = lodash.concat(getStubs(transactionDetails), [
        {
          name: 'postRefundAmountNotAvailable',
          opts: {
            gateway_account_id: gatewayAccountId,
            charge_id: transactionDetails.transaction_id,
            amount: refundAmount,
            refund_amount_available: transactionDetails.amount,
            user_external_id: userExternalId,
            user_email: userEmail
          }
        }
      ])
      cy.task('setupStubs', stubs)

      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Select partial refund
      cy.get('#partial').click()

      // Select partial refund
      cy.get('#refund-amount').type('10.01')

      // Click the refund submit button
      cy.get('#refund-button').click()

      // Ensure the flash container is showing
      cy.get('.flash-container').should('be.visible')

      cy.get('.flash-container').find('.error-summary').should('contain', 'The amount you tried to refund is greater than the transaction total')
    })

    it('should allow a refund to be re-attempted in the event of a failed refund', () => {
      const aFailedRefundTransaction = defaultTransactionDetails()
      aFailedRefundTransaction.refund_summary_status = 'error'
      cy.task('setupStubs', getStubs(aFailedRefundTransaction))

      cy.visit(`${transactionsUrl}/${aFailedRefundTransaction.transaction_id}`)

      // Ensure the refund button is available
      cy.get('.target-to-show--toggle').should('be.visible')
      cy.get('.target-to-show--toggle').should('be.enabled')

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Select partial refund
      cy.get('#partial').click()

      // Select partial refund
      cy.get('#refund-amount').type(aFailedRefundTransaction.amount / 100)

      // Click the refund submit button
      cy.get('#refund-button').click()
    })

    it('should display full refund amount with corporate card surcharge when there is a corporate card surcharge', () => {
      const aCorporateCardSurchargeTransaction = defaultTransactionDetails()
      aCorporateCardSurchargeTransaction.corporate_card_surcharge = 250
      aCorporateCardSurchargeTransaction.total_amount = 1250
      cy.task('setupStubs', getStubs(aCorporateCardSurchargeTransaction))

      cy.visit(`${transactionsUrl}/${aCorporateCardSurchargeTransaction.transaction_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Assert refund message
      cy.get('.govuk-radios__hint').first().should('contain', `Refund the full amount of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeTransaction.refund_summary_available)} (including a card fee of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeTransaction.corporate_card_surcharge)})`)
    })

    it('should display full refund amount without corporate card surcharge when there is no corporate card surcharge', () => {
      const transactionDetails = defaultTransactionDetails()
      cy.task('setupStubs', getStubs(transactionDetails))
      cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Assert refund message
      cy.get('.govuk-radios__hint').first().should('contain', `Refund the full amount of ${convertPenceToPoundsFormatted(transactionDetails.refund_summary_available)}`)
    })
  })

  it('should display Wallet Type where available', () => {
    const transactionDetails = defaultTransactionDetails()
    transactionDetails.wallet_type = 'APPLE_PAY'
    cy.task('setupStubs', getStubs(transactionDetails))
    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)
    cy.get('th').contains('Wallet type').siblings().first().should('contain', 'Apple Pay')
  })

  it('should not display Wallet Type when not included in charge', () => {
    const transactionDetails = defaultTransactionDetails()
    cy.task('setupStubs', getStubs(transactionDetails))
    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)
    cy.get('.transaction-details tbody').should('not.contain', 'Wallet Type')
  })

  it('should display metadata when available', () => {
    const transactionDetails = defaultTransactionDetails()
    transactionDetails.metadata = {
      key1: 123,
      key2: true,
      key3: 'some string'
    }
    cy.task('setupStubs', getStubs(transactionDetails))
    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)
    cy.get('h2').should('contain', 'Metadata')
    cy.get('th').contains('key1').siblings().first().should('contain', '123')
    cy.get('th').contains('key2').siblings().first().should('contain', 'true')
    cy.get('th').contains('key3').siblings().first().should('contain', 'some string')
  })

  it('should not display metadata when unavailable', () => {
    const transactionDetails = defaultTransactionDetails()
    cy.task('setupStubs', getStubs(transactionDetails))
    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)
    cy.get('h2').should('not.contain', 'Metadata')
  })

  it('should show fee breakdown for stripe tranaction with associated fees', () => {
    const transactionDetails = defaultTransactionDetails()
    transactionDetails.payment_provider = 'stripe'
    transactionDetails.fee = 100
    transactionDetails.net_amount = defaultAmount - 100
    cy.task('setupStubs', getStubs(transactionDetails))
    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)
    cy.get('.transaction-details tbody').find('[data-cell-type="fee"]').first().should('have.text', convertPenceToPoundsFormatted(transactionDetails.fee))
    cy.get('.transaction-details tbody').find('[data-cell-type="net"]').first().should('have.text', convertPenceToPoundsFormatted(transactionDetails.amount - transactionDetails.fee))
  })

  it('should not display MOTO row when MOTO payments are not enabled for the gateway account', () => {
    const transactionDetails = defaultTransactionDetails()
    cy.task('setupStubs', getStubs(transactionDetails, { allow_moto: false }))

    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

    cy.get('th').contains('MOTO:').should('not.exist')
  })

  it('should display MOTO row when MOTO payments are enabled for the gateway account and the transaction is a MOTO payment', () => {
    const transactionDetails = defaultTransactionDetails()
    transactionDetails.moto = true
    cy.task('setupStubs', getStubs(transactionDetails, { allow_moto: true }))

    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

    cy.get('th').contains('MOTO:').should('exist')
    cy.get('#moto').should('have.text', 'Yes')
  })

  it('should display MOTO row when MOTO payments are enabled for the gateway account and the transaction is not a MOTO payment', () => {
    const transactionDetails = defaultTransactionDetails()
    transactionDetails.moto = false
    cy.task('setupStubs', getStubs(transactionDetails, { allow_moto: true }))

    cy.visit(`${transactionsUrl}/${transactionDetails.transaction_id}`)

    cy.get('th').contains('MOTO:').should('exist')
    cy.get('#moto').should('have.text', 'No')
  })
})
