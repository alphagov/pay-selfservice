const lodash = require('lodash')

const capitalise = string => string[0].toUpperCase() + string.slice(1)
const convertPenceToPoundsFormatted = pence => `£${(pence / 100).toFixed(2)}`
const defaultAmount = 1000

function formatDate (date) {
  const monthNames = [
    'January', 'February', 'March',
    'April', 'May', 'June', 'July',
    'August', 'September', 'October',
    'November', 'December'
  ]

  let day = date.getDate()
  day = day.toString().length > 1 ? day : '0' + day
  const monthIndex = date.getMonth()
  const year = date.getFullYear()

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' — '
}

function defaultChargeDetails () {
  return {
    charge: {
      charge_id: '12345',
      reference: 'ref123',
      amount: defaultAmount,
      state_finished: true,
      state_status: 'success',
      refund_summary_status: 'available',
      refund_summary_available: 1000,
      refund_summary_submitted: 0,
      gateway_transaction_id: 'abcde',
      card_brand: 'visa',
      cardholder_name: 'Test User',
      last_digits_card_number: '0002',
      expiry_date: '08/23',
      email: 'example@example.com',
      payment_provider: 'sandbox',
      delayed_capture: false
    },
    events: [{
      amount: defaultAmount,
      updated: '2018-05-01T13:27:18.126Z'
    }]
  }
}

describe('Transactions details page', () => {
  const transactionsUrl = `/transactions`
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Test Service'

  const getStubs = (chargeDetails) => {
    return [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [{
            service: {
              name: serviceName,
              gateway_account_ids: [gatewayAccountId]
            }
          }]
        }
      },
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      },
      {
        name: 'getChargeSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          chargeDetails: chargeDetails.charge
        }
      },
      {
        name: 'getChargeEventsSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          charge_id: chargeDetails.charge.charge_id,
          events: chargeDetails.events
        }
      }
    ]
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('page content', () => {
    it('should display transaction details correctly when delayed capture is OFF', () => {
      const chargeDetails = defaultChargeDetails()
      cy.task('setupGetUserAndGatewayAccountStubs', getStubs(chargeDetails))

      cy.visit(`${transactionsUrl}/${chargeDetails.charge.charge_id}`)

      // Ensure page title is correct
      cy.title().should('eq', `Transaction details ${chargeDetails.charge.reference} - ${serviceName} sandbox test - GOV.UK Pay`)

      // Ensure page details match up

      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        chargeDetails.charge.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(chargeDetails.charge.state_status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(chargeDetails.charge.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(chargeDetails.charge.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('contain',
        formatDate(new Date(chargeDetails.events[0].updated)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        capitalise(chargeDetails.charge.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('have.text',
        chargeDetails.charge.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        chargeDetails.charge.charge_id)
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        chargeDetails.charge.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        chargeDetails.charge.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        `**** **** **** ${chargeDetails.charge.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        chargeDetails.charge.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        chargeDetails.charge.email)
      cy.get('#delayed-capture').should('not.exist')
    })

    it('should display transaction details correctly when delayed capture is ON', () => {
      const aDelayedCaptureCharge = defaultChargeDetails()
      aDelayedCaptureCharge.charge.delayed_capture = true
      cy.task('setupGetUserAndGatewayAccountStubs', getStubs(aDelayedCaptureCharge))

      cy.visit(`${transactionsUrl}/${aDelayedCaptureCharge.charge.charge_id}`)

      // Ensure page title is correct
      cy.title().should('eq', `Transaction details ${aDelayedCaptureCharge.charge.reference} - ${serviceName} sandbox test - GOV.UK Pay`)

      // Ensure page details match up

      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').first().should('contain',
        capitalise(aDelayedCaptureCharge.charge.state_status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(aDelayedCaptureCharge.charge.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').first().should('have.text',
        convertPenceToPoundsFormatted(aDelayedCaptureCharge.charge.refund_summary_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').first().should('contain',
        formatDate(new Date(aDelayedCaptureCharge.events[0].updated)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').first().should('have.text',
        capitalise(aDelayedCaptureCharge.charge.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.charge_id)
      // Delayed capture
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').first().should('have.text',
        'On')
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').first().should('have.text',
        `**** **** **** ${aDelayedCaptureCharge.charge.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(13).find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(14).find('td').first().should('have.text',
        aDelayedCaptureCharge.charge.email)
    })

    it('should display corporate card surcharge in the amount field correctly when there is a corporate card surcharge', () => {
      const aCorporateCardSurchargeCharge = defaultChargeDetails()
      aCorporateCardSurchargeCharge.charge.corporate_card_surcharge = 250
      aCorporateCardSurchargeCharge.charge.total_amount = 1250
      cy.task('setupGetUserAndGatewayAccountStubs', getStubs(aCorporateCardSurchargeCharge))

      cy.visit(`${transactionsUrl}/${aCorporateCardSurchargeCharge.charge.charge_id}`)

      // Ensure page title is correct
      cy.title().should('eq', `Transaction details ${aCorporateCardSurchargeCharge.charge.reference} - ${serviceName} sandbox test - GOV.UK Pay`)

      // Ensure page details match up

      // Amount
      cy.get('#amount').should('have.text',
        `${convertPenceToPoundsFormatted(aCorporateCardSurchargeCharge.charge.total_amount)} (including a card fee of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeCharge.charge.corporate_card_surcharge)})`)
    })
  })

  describe('refunds', () => {
    it('should fail when an invalid refund amount is specified', () => {
      const chargeDetails = defaultChargeDetails()
      const refundAmount = chargeDetails.charge.amount + 1
      const stubs = lodash.concat(getStubs(chargeDetails), [
        {
          name: 'postRefundAmountNotAvailable',
          opts: {
            gateway_account_id: gatewayAccountId,
            charge_id: chargeDetails.charge.charge_id,
            amount: refundAmount,
            refund_amount_available: chargeDetails.charge.amount,
            user_external_id: userExternalId
          }
        }
      ])
      cy.task('setupGetUserAndGatewayAccountStubs', stubs)

      cy.visit(`${transactionsUrl}/${chargeDetails.charge.charge_id}`)

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
      const aFailedRefundCharge = defaultChargeDetails()
      aFailedRefundCharge.charge.refund_summary_status = 'error'
      cy.task('setupGetUserAndGatewayAccountStubs', getStubs(aFailedRefundCharge))

      cy.visit(`${transactionsUrl}/${aFailedRefundCharge.charge.charge_id}`)

      // Ensure the refund button is available
      cy.get('.target-to-show--toggle').should('be.visible')
      cy.get('.target-to-show--toggle').should('be.enabled')

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Select partial refund
      cy.get('#partial').click()

      // Select partial refund
      cy.get('#refund-amount').type(aFailedRefundCharge.charge.amount / 100)

      // Click the refund submit button
      cy.get('#refund-button').click()
    })

    it('should display full refund amount with corporate card surcharge when there is a corporate card surcharge', () => {
      const aCorporateCardSurchargeCharge = defaultChargeDetails()
      aCorporateCardSurchargeCharge.charge.corporate_card_surcharge = 250
      aCorporateCardSurchargeCharge.charge.total_amount = 1250
      cy.task('setupGetUserAndGatewayAccountStubs', getStubs(aCorporateCardSurchargeCharge))

      cy.visit(`${transactionsUrl}/${aCorporateCardSurchargeCharge.charge.charge_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Assert refund message
      cy.get('.govuk-radios__hint').first().should('contain', `Refund the full amount of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeCharge.charge.refund_summary_available)} (including a card fee of ${convertPenceToPoundsFormatted(aCorporateCardSurchargeCharge.charge.corporate_card_surcharge)})`)
    })

    it('should display full refund amount without corporate card surcharge when there is no corporate card surcharge', () => {
      const chargeDetails = defaultChargeDetails()
      cy.task('setupGetUserAndGatewayAccountStubs', getStubs(chargeDetails))
      cy.visit(`${transactionsUrl}/${chargeDetails.charge.charge_id}`)

      // Click the refund button
      cy.get('.target-to-show--toggle').click()

      // Assert refund message
      cy.get('.govuk-radios__hint').first().should('contain', `Refund the full amount of ${convertPenceToPoundsFormatted(chargeDetails.charge.refund_summary_available)}`)
    })
  })

  it('should display Wallet Type where available', () => {
    const chargeDetails = defaultChargeDetails()
    chargeDetails.charge.wallet_type = 'APPLE_PAY'
    cy.task('setupGetUserAndGatewayAccountStubs', getStubs(chargeDetails))
    cy.visit(`${transactionsUrl}/${chargeDetails.charge.charge_id}`)
    cy.get('th').contains('Wallet type').siblings().first().should('contain', 'Apple Pay')
  })

  it('should not display Wallet Type when not included in charge', () => {
    const chargeDetails = defaultChargeDetails()
    cy.task('setupGetUserAndGatewayAccountStubs', getStubs(chargeDetails))
    cy.visit(`${transactionsUrl}/${chargeDetails.charge.charge_id}`)
    cy.get('.transaction-details tbody').should('not.contain', 'Wallet Type')
  })
})
