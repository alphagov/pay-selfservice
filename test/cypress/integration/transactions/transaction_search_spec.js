describe('Transactions', () => {
  const transactionsUrl = `/transactions`
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const stripeUserExternalId = 'someotheruniqueid'
  const gatewayAccountId = 42
  const feesAccountId = 50
  const serviceName = 'Test Service'

  const convertPenceToPoundsFormatted = pence => `£${(pence / 100).toFixed(2)}`

  const unfilteredTransactions = [
    {
      reference: 'unfiltered1',
      amount: 1000
    },
    {
      reference: 'unfiltered2',
      amount: 2000
    },
    {
      reference: 'unfiltered3',
      amount: 3000,
      corporate_card_surcharge: 250,
      total_amount: 3250
    }
  ]

  const filteredByFromDateTransactions = [
    {
      reference: 'filtered-by-from-date1'
    },
    {
      reference: 'filtered-by-from-date2'
    }
  ]

  const filteredByToDateTransactions = [
    {
      reference: 'filtered-by-to-date'
    }
  ]

  const filteredByPartialEmailAndCardBrandTransactions = [
    {
      reference: 'filtered-by-brand-and-email'
    }
  ]

  const filteredByMultipleFieldsTransactions = [
    {
      reference: 'filtered-by-multiple-fields'
    }
  ]

  const transactionsWithAssociatedFees = [
    { reference: 'first-transaction-with-fee', amount: 3000, fee: 300, net_amount: 2700 },
    { reference: 'second-transaction-with-fee', amount: 5000, fee: 500, net_amount: 4500 }
  ]

  describe('Default sandbox gatway transactions', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)

      cy.task('setupStubs', [
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
          name: 'getCardTypesSuccess'
        },
        // unfiltered transactions stub
        {
          name: 'getTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {},
            transactions: unfilteredTransactions
          }
        },
        // transactions filtered by from date stub
        {
          name: 'getTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {
              from_date: '2018-05-03T00:00:00.000Z'
            },
            transactions: filteredByFromDateTransactions
          }
        },
        // transactions filtered by to date stub
        {
          name: 'getTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {
              to_date: '2018-05-03T00:00:01.000Z'
            },
            transactions: filteredByToDateTransactions
          }
        },
        // transactions filtered by partial email and multiple card brands stub
        {
          name: 'getTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {
              email: 'gds4',
              card_brand: ['visa', 'master-card']
            },
            transactions: filteredByPartialEmailAndCardBrandTransactions
          }
        },
        // transactions filtered by multiple fields stub
        {
          name: 'getTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {
              reference: 'ref123',
              from_date: '2018-05-03T00:00:00.000Z',
              to_date: '2018-05-04T00:00:01.000Z',
              payment_states: 'created,started,submitted,capturable,success'
            },
            transactions: filteredByMultipleFieldsTransactions
          }
        }
      ])

      cy.visit(transactionsUrl)
    })

    describe('Transactions List', () => {
      it(`should have the page title 'Transactions - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        cy.title().should('eq', `Transactions - ${serviceName} sandbox test - GOV.UK Pay`)
      })

      describe('Filtering', () => {
        it('should have the right number of transactions in an unfiltered state', () => {
          // Ensure the transactions list has the right number of items
          cy.get('#transactions-list tbody').find('tr').should('have.length', unfilteredTransactions.length)

          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', unfilteredTransactions[0].reference)
          cy.get('#transactions-list tbody').find('tr').eq(1).find('th').should('contain', unfilteredTransactions[1].reference)
          cy.get('#transactions-list tbody').find('tr').eq(2).find('th').should('contain', unfilteredTransactions[2].reference)
        })

        it('should have the right number of transactions in a filtered state', () => {
          // 1. Filtering FROM
          // Ensure both the date/time pickers aren't showing
          cy.get('.datepicker').should('not.be.visible')
          cy.get('.ui-timepicker-wrapper').should('not.be.visible')

          // Fill in a from date
          cy.get('#fromDate').type('03/5/2018')

          // Ensure only the datepicker is showing
          cy.get('.datepicker').should('be.visible')
          cy.get('.ui-timepicker-wrapper').should('not.be.visible')

          // Fill in a from time
          cy.get('#fromTime').type('01:00:00')

          // Ensure only the timepicker is showing
          cy.get('.datepicker').should('not.be.visible')
          cy.get('.ui-timepicker-wrapper').should('be.visible')

          // Click the filter button
          cy.get('#filter').click()

          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByFromDateTransactions.length)

          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByFromDateTransactions[0].reference)
          cy.get('#transactions-list tbody').find('tr').eq(1).find('th').should('contain', filteredByFromDateTransactions[1].reference)

          // Clear filters
          cy.get('#fromDate').clear()
          cy.get('#fromTime').clear()

          // 2. Filtering TO

          // Fill in a to date
          cy.get('#toDate').type('03/5/2018')

          // Ensure only the datepicker is showing
          cy.get('.datepicker').should('be.visible')
          cy.get('.ui-timepicker-wrapper').should('not.be.visible')

          // Fill in a to time
          cy.get('#toTime').type('01:00:00')

          // Ensure only the timepicker is showing
          cy.get('.datepicker').should('not.be.visible')
          cy.get('.ui-timepicker-wrapper').should('be.visible')

          // Click the filter button
          cy.get('#filter').click()

          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByToDateTransactions.length)

          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByToDateTransactions[0].reference)
        })

        it('should have the right number of transactions when filtering by multiple card brands and a partial email', () => {
          cy.get('#card-brand').click()
          cy.get(`#card-brand .govuk-checkboxes__input[value=visa]`).click()
          cy.get(`#card-brand .govuk-checkboxes__input[value=master-card]`).click()

          cy.get('#email').type('gds4')
          cy.get('#filter').click()

          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByPartialEmailAndCardBrandTransactions.length)

          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByPartialEmailAndCardBrandTransactions[0].reference)
        })

        it('should have the right number of transactions when filtering by multiple payment states, a start and end date and a partial reference', () => {
          cy.get('#state').click()
          cy.get(`#state .govuk-checkboxes__input[value='Success']`).click()
          cy.get(`#state .govuk-checkboxes__input[value='In progress']`).click()

          cy.get('#reference').type('ref123')
          cy.get('#fromDate').type('03/5/2018')
          cy.get('#fromTime').type('01:00:00')
          cy.get('#toDate').type('04/5/2018')
          cy.get('#toTime').type('01:00:00')
          cy.get('#filter').click()
          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByMultipleFieldsTransactions.length)
          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByMultipleFieldsTransactions[0].reference)
        })
      })

      describe('Transactions are displayed correctly in the list', () => {
        it('should display card fee with corporate card surcharge transaction', () => {
          // Ensure the transactions list has the right number of items
          cy.get('#transactions-list tbody').find('tr').should('have.length', unfilteredTransactions.length)

          // Ensure the values are displayed correctly
          cy.get('#transactions-list tbody').first().find('td').eq(1).should('have.text', convertPenceToPoundsFormatted(unfilteredTransactions[0].amount))
          cy.get('#transactions-list tbody').find('tr').eq(1).find('td').eq(1).should('have.text', convertPenceToPoundsFormatted(unfilteredTransactions[1].amount))

          // Ensure the card fee is displayed correctly
          cy.get('#transactions-list tbody').find('tr').eq(2).find('td').eq(1).should('contain', convertPenceToPoundsFormatted(unfilteredTransactions[2].total_amount)).and('contain', '(with card fee)')
        })
      })
    })
  })
  describe('Stripe gateway transactions with expected fees', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(stripeUserExternalId, feesAccountId)
      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: stripeUserExternalId,
            service_roles: [{
              service: {
                name: serviceName,
                gateway_account_ids: [feesAccountId]
              }
            }]
          }
        },
        {
          name: 'getGatewayAccountSuccess',
          opts: { gateway_account_id: feesAccountId, payment_provider: 'stripe' }
        },
        {
          name: 'getCardTypesSuccess'
        },
        {
          name: 'getTransactionsSuccess',
          opts: {
            gateway_account_id: feesAccountId,
            filters: {},
            transactions: transactionsWithAssociatedFees
          }
        }
      ])

      cy.visit(transactionsUrl)
    })
    describe('Stripe transactions with associated fees are displayed correctly', () => {
      it('should display the fee and total columns for a stripe gateway with fees', () => {
        cy.get('#transactions-list tbody').find('tr').should('have.length', transactionsWithAssociatedFees.length)

        cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').first().should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[0].fee))
        cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').first().find('span').should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[0].amount - transactionsWithAssociatedFees[0].fee))

        cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="fee"]').eq(1).should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[1].fee))
        cy.get('#transactions-list tbody').find('tr').first().get('[data-cell-type="net"]').eq(1).find('span').should('have.text', convertPenceToPoundsFormatted(transactionsWithAssociatedFees[1].amount - transactionsWithAssociatedFees[1].fee))
      })
    })
  })
})
