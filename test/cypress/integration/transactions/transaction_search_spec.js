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
      amount: 1000,
      type: 'payment'
    },
    {
      reference: 'unfiltered2',
      amount: 2000,
      type: 'payment'
    },
    {
      reference: 'unfiltered3',
      amount: 3000,
      corporate_card_surcharge: 250,
      total_amount: 3250,
      type: 'payment'
    }
  ]

  const filteredByFromDateTransactions = [
    {
      reference: 'filtered-by-from-date1',
      amount: 1000,
      type: 'payment'
    },
    {
      reference: 'filtered-by-from-date2',
      amount: 1500,
      type: 'payment'
    }
  ]

  const filteredByToDateTransactions = [
    {
      reference: 'filtered-by-to-date',
      amount: 1500,
      type: 'payment'
    }
  ]

  const filteredByPartialEmailAndCardBrandTransactions = [
    {
      reference: 'filtered-by-brand-and-email',
      amount: 1500,
      type: 'payment',
      card_brand: [
        'visa',
        'master-card'
      ]
    }
  ]

  const filteredByMultipleFieldsTransactions = [
    {
      reference: 'filtered-by-multiple-fields',
      amount: 1500,
      type: 'payment'
    }
  ]

  const filteredByLastDigitsCardNumberTransactions = [
    {
      reference: 'filtered-by-last-digits-card-number',
      amount: 1500,
      type: 'payment',
      last_digits_card_number: '42424'
    }
  ]

  const filteredByCardHolderNameTransactions = [
    {
      reference: 'filtered-by-cardholder-name',
      amount: 1500,
      type: 'payment',
      cardholder_name: 'J. Doe'
    }
  ]

  const filteredByReferenceTransactions = [
    {
      reference: 'filtered-by-partial-reference1',
      amount: 1500,
      type: 'payment'
    }, {
      reference: 'filtered-by-partial-reference2',
      amount: 1500,
      type: 'payment'
    }
  ]

  const transactionsWithAssociatedFees = [
    {
      reference: 'first-transaction-with-fee',
      amount: 3000,
      fee: 300,
      net_amount: 2700,
      type: 'payment',
      payment_provider: 'stripe'
    },
    {
      reference: 'second-transaction-with-fee',
      amount: 5000,
      fee: 500,
      net_amount: 4500,
      type: 'payment',
      payment_provider: 'stripe'
    }
  ]

  const setupStubs = [
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
      name: 'getLedgerTransactionsSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        filters: {},
        transactions: unfilteredTransactions
      }
    },
    // transactions filtered by from date stub
    {
      name: 'getLedgerTransactionsSuccess',
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
      name: 'getLedgerTransactionsSuccess',
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
      name: 'getLedgerTransactionsSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        filters: {
          email: 'gds4',
          card_brands: 'visa,master-card'
        },
        transactions: filteredByPartialEmailAndCardBrandTransactions
      }
    },
    // transactions filtered by multiple fields stub
    {
      name: 'getLedgerTransactionsSuccess',
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
    },
    // transactions filtered by last digit card numbers
    {
      name: 'getLedgerTransactionsSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        filters: {
          last_digits_card_number: '4242'
        },
        transactions: filteredByLastDigitsCardNumberTransactions
      }
    },
    // transactions filtered by cardholder name
    {
      name: 'getLedgerTransactionsSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        filters: {
          cardholder_name: 'doe'
        },
        transactions: filteredByCardHolderNameTransactions
      }
    },
    // transactions filtered by reference
    {
      name: 'getLedgerTransactionsSuccess',
      opts: {
        gateway_account_id: gatewayAccountId,
        filters: {
          reference: 'filtered-by-reference'
        },
        transactions: filteredByReferenceTransactions
      }
    }
  ]

  describe('Default sandbox gatway transactions', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.task('setupStubs', setupStubs)
      cy.visit(transactionsUrl)
    })
    describe('Transactions List', () => {
      it(`should have the page title 'Transactions - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        cy.title().should('eq', `Transactions - ${serviceName} Sandbox test - GOV.UK Pay`)
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
          cy.get('#download-transactions-link').should('have.attr', 'href', '/transactions/download?email=gds4&brand=visa&brand=master-card')
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

        it('should should have the right number of transactions when filtering by last digit card numbers', function () {
          cy.get('#lastDigitsCardNumber').type('4242')
          cy.get('#filter').click()
          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByLastDigitsCardNumberTransactions.length)
          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByLastDigitsCardNumberTransactions[0].reference)
        })

        it('should should have the right number of transactions when filtering by cardholder name', function () {
          cy.get('#cardholderName').type('doe')
          cy.get('#filter').click()
          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByCardHolderNameTransactions.length)
          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByCardHolderNameTransactions[0].reference)
        })

        it('should should have the right number of transactions when filtering by full reference', function () {
          cy.get('#reference').type('filtered-by-reference')
          cy.get('#filter').click()
          // Ensure the right number of transactions is displayed
          cy.get('#transactions-list tbody').find('tr').should('have.length', filteredByReferenceTransactions.length)
          // Ensure the expected transactions are shown
          cy.get('#transactions-list tbody').find('tr').first().find('th').should('contain', filteredByReferenceTransactions[0].reference)
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
          cy.get('#download-transactions-link').should('have.attr', 'href', '/transactions/download')
        })
      })
    })
  })
  describe('Transaction list - should filter by refund state', () => {
    beforeEach(() => {
      const transactionWithRefund = unfilteredTransactions
      transactionWithRefund.push({
        reference: 'unfiltered4',
        amount: 2000,
        type: 'refund',
        status: 'submitted',
        finished: true
      })
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
        {
          name: 'getLedgerTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {},
            transactions: transactionWithRefund
          }
        },
        {
          name: 'getLedgerTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {
              refund_states: 'submitted'
            },
            transactions: [{
              reference: 'unfiltered4',
              amount: 2000,
              type: 'refund',
              status: 'submitted',
              finished: true
            }]
          }
        }
      ])
      cy.visit(transactionsUrl)
    })
    it('should allow filtering by refund states', function () {
      cy.get('#state').click()
      cy.get(`#state .govuk-checkboxes__input[value='Refund submitted']`).click()
      cy.get('#filter').click()
      // Ensure the right number of transactions is displayed
      cy.get('#transactions-list tbody').find('tr').should('have.length', 1)
      cy.get('#download-transactions-link').should('have.attr', 'href', '/transactions/download?refund_states=submitted')
    })
  })
  describe('Transaction list - no result', () => {
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
        {
          name: 'getLedgerTransactionsSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            filters: {},
            transactions: []
          }
        }
      ])
      cy.visit(transactionsUrl)
    })
    it('should display no transactions', function () {
      cy.get('#transactions-list tbody').should('not.exist')
    })
  })
  describe('Transaction list - no csv download link when total > 10k', () => {
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
        {
          name: 'getLedgerTransactionsSuccess',
          opts: {
            page: 1,
            transaction_length: 10001,
            transaction_count: 3,
            gateway_account_id: gatewayAccountId,
            filters: {},
            transactions: unfilteredTransactions
          }
        }
      ])
      cy.visit(transactionsUrl)
    })
    it('should not display csv download link', function () {
      cy.get('#download-transactions-link').should('not.exist')
      cy.get('.govuk-body').should('contain', 'You cannot download CSV over 10,000 transactions. Please refine your search')
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
          name: 'getLedgerTransactionsSuccess',
          opts: {
            gateway_account_id: feesAccountId,
            filters: {},
            transactions: transactionsWithAssociatedFees
          }
        },
        {
          name: 'getGatewayAccountStripeSetupSuccess',
          opts: {
            gateway_account_id: feesAccountId,
            bank_account: true,
            responsible_person: true,
            vat_number_company_number: true
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
