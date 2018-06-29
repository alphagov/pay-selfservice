describe('Transactions', () => {
  const transactionsUrl = `/transactions`

  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')

  const capitalise = string => string[0].toUpperCase() + string.slice(1)
  const convertAmounts = val => '£' + (val / 100).toFixed(2)

  function formatDate (date) {

    const monthNames = [
      'January', 'February', 'March',
      'April', 'May', 'June', 'July',
      'August', 'September', 'October',
      'November', 'December'
    ]

    let day = date.getDate();
    day = day.toString().length > 1 ? day : '0' + day
    const monthIndex = date.getMonth();
    const year = date.getFullYear()
    let hours = date.getHours()
    hours = hours.toString().length > 1 ? hours : '0' + hours
    let minutes = date.getMinutes()
    minutes = minutes.toString().length > 1 ? minutes : '0' + minutes
    let seconds = date.getSeconds()
    seconds = seconds.toString().length > 1 ? seconds : '0' + seconds

    return day + ' ' + monthNames[monthIndex] + ' ' + year + ' — ' + hours + ':' + minutes + ':' + seconds
  }

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
  })

  describe('Transaction details page', () => {

    const selfServiceDefaultUser = selfServiceUsers.config.users.filter(fil => fil.isPrimary === 'true')[0]

    it('should display transaction details correctly', () => {

      const aSmartpayCharge = selfServiceDefaultUser.sections.transactions.data[0]
      const aSmartpayChargeDetails = selfServiceDefaultUser.sections.transactions.details_data[0]

      cy.visit(`${transactionsUrl}/${aSmartpayCharge.charge_id}`)

      // Ensure page title is correct
      cy.title().should('eq', `Transaction details ${aSmartpayCharge.reference} - System Generated test - GOV.UK Pay`)

      // Ensure page details match up

      // Reference number
      cy.get('.transaction-details tbody').find('tr').first().find('td').eq(1).should('have.text',
        aSmartpayCharge.reference)
      // Status
      cy.get('.transaction-details tbody').find('tr').eq(1).find('td').eq(1).should('have.text',
        capitalise(aSmartpayCharge.state.status))
      // Amount
      cy.get('.transaction-details tbody').find('tr').eq(2).find('td').eq(1).should('have.text',
        convertAmounts(aSmartpayCharge.amount))
      // Refunded amount
      cy.get('.transaction-details tbody').find('tr').eq(3).find('td').eq(1).should('have.text',
        convertAmounts(aSmartpayChargeDetails.refund_summary.amount_submitted))
      // Date created
      cy.get('.transaction-details tbody').find('tr').eq(4).find('td').eq(1).should('have.text',
        formatDate(new Date(aSmartpayChargeDetails.charge_events[0].updated)))
      // Provider
      cy.get('.transaction-details tbody').find('tr').eq(5).find('td').eq(1).should('have.text',
        capitalise(aSmartpayCharge.payment_provider))
      // Provider ID
      cy.get('.transaction-details tbody').find('tr').eq(6).find('td').eq(1).should('have.text',
        aSmartpayCharge.gateway_transaction_id)
      // GOVUK Payment ID
      cy.get('.transaction-details tbody').find('tr').eq(7).find('td').eq(1).should('have.text',
        aSmartpayCharge.charge_id)
      // Payment method
      cy.get('.transaction-details tbody').find('tr').eq(8).find('td').eq(1).should('have.text',
        aSmartpayCharge.card_details.card_brand)
      // Name on card
      cy.get('.transaction-details tbody').find('tr').eq(9).find('td').eq(1).should('have.text',
        aSmartpayCharge.card_details.cardholder_name)
      // Card number
      cy.get('.transaction-details tbody').find('tr').eq(10).find('td').eq(1).should('have.text',
        `**** **** **** ${aSmartpayCharge.card_details.last_digits_card_number}`)
      // Card expiry date
      cy.get('.transaction-details tbody').find('tr').eq(11).find('td').eq(1).should('have.text',
        aSmartpayCharge.card_details.expiry_date)
      // Email
      cy.get('.transaction-details tbody').find('tr').eq(12).find('td').eq(1).should('have.text',
        aSmartpayCharge.email)

    })

  })
})
