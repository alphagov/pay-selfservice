'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const connectorChargeStubs = require('../../stubs/connector-charge-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const merchantId = 'abc'
const username = 'me'
const password = '1'
const organisationalUnitId = '5bd9b55e4444761ac0af1c82'
const issuer = '5bd9e0e4444dce153428c942'
const jwtMacKey = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
const currentCredentialExternalId = 'smartpay-cred'
const currentCredentialId = 1
const switchingToCredentialExternalId = 'worlpday-cred'
const switchingToCredentialId = 2

function getUserAndAccountStubs (
  paymentProvider,
  providerSwitchEnabled,
  gatewayAccountCredentials,
  merchantDetails,
  requires3ds,
  integrationVersion3ds,
  allowMoto
) {
  return [
    userStubs.getUserSuccess({ gatewayAccountId, userExternalId, merchantDetails }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      providerSwitchEnabled,
      paymentProvider,
      ...gatewayAccountCredentials && { gatewayAccountCredentials },
      requires3ds,
      integrationVersion3ds,
      allowMoto
    }),
    gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
  ]
}

function getUserAndAccountStubsForSwitchingNotStarted () {
  return getUserAndAccountStubs('smartpay', true, [
    {
      payment_provider: 'smartpay',
      state: 'ACTIVE',
      id: currentCredentialId,
      external_id: currentCredentialExternalId
    },
    {
      payment_provider: 'worldpay',
      state: 'CREATED',
      id: switchingToCredentialId,
      external_id: switchingToCredentialExternalId
    }
  ])
}

describe('Switch PSP settings page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('When using an account with switching flag disabled', () => {
    it('should not show link to Switch PSP in the side navigation', () => {
      cy.task('setupStubs', getUserAndAccountStubs('smartpay', false))

      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('.service-info--tag').should('not.contain', 'switching psp')
      cy.get('#navigation-menu-switch-psp').should('have.length', 0)
    })
  })

  describe('When using an account with switching flag enabled', () => {
    describe('When Worldpay non-MOTO account', () => {
      describe('When switching is not started', () => {
        it('should show dashboard message for switching psp', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubsForSwitchingNotStarted(),
            transactionStubs.getTransactionsSummarySuccess()
          ])

          cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
          cy.get('.govuk-notification-banner__heading').should('contain', 'Switch your payment service provider (PSP) to Worldpay')
        })

        it('should show the switch message for current psp page', () => {
          cy.task('setupStubs', getUserAndAccountStubsForSwitchingNotStarted())

          cy.visit(`/account/${gatewayAccountExternalId}/settings`)
          cy.get('a').contains('Your PSP - Smartpay').click()
          cy.get('#switched-psp-status').should('contain', 'Your service is ready to switch PSP from Smartpay to Worldpay.')
        })

        it('should show the switch PSP page for switching to Worldpay with tasks not started', () => {
          cy.task('setupStubs', getUserAndAccountStubsForSwitchingNotStarted())

          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('.service-info--tag').should('contain', 'switch psp')
          cy.get('#navigation-menu-switch-psp').should('have.length', 1)
          cy.get('h1').should('contain', 'Switch payment service provider')
          cy.get('li').contains('your Worldpay account credentials: Merchant code, username and password').should('exist')
          cy.get('#switch-psp-action-step').should('contain', 'Switch PSP to Worldpay')
          cy.get('.govuk-warning-text').should('contain', 'Once you switch, Worldpay will immediately start taking payments. You can refund previous payments through Smartpay.')

          cy.get('.app-task-list>li').eq(0).should('contain', 'Get ready to switch PSP')
            .within(() => {
              cy.get('.app-task-list__item').should('have.length', 3)
              cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
                .find('.app-task-list__tag').should('have.text', 'not started')
              cy.get('.app-task-list__item').eq(1).should('contain', 'Provide your Worldpay 3DS Flex credentials')
                .find('.app-task-list__tag').should('have.text', 'not started')
              cy.get('.app-task-list__item').eq(2).should('contain', 'Make a live payment to test your Worldpay PSP')
                .find('.app-task-list__tag').should('have.text', 'cannot start yet')
            })
          cy.get('button').contains('Switch to Worldpay').should('have.disabled')
        })

        it('should allow linking account', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubsForSwitchingNotStarted(),
            gatewayAccountStubs.postCheckWorldpayCredentials({
              gatewayAccountId,
              merchant_code: merchantId,
              username,
              password
            }),
            gatewayAccountStubs.patchUpdateCredentialsSuccess(gatewayAccountId, switchingToCredentialId),
            gatewayAccountStubs.patchUpdateCredentialsSuccess(gatewayAccountId, 1)
          ])

          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)

          cy.get('.app-task-list__item').contains('Link your Worldpay account with GOV.UK Pay').click()
          cy.get('h1').should('contain', 'Your Worldpay credentials')
          cy.get('.govuk-back-link').should('contain', 'Back to Switching payment service provider (PSP)')

          cy.get('#merchantId').type('abc')
          cy.get('#username').type('me')
          cy.get('#password').type('1')
          cy.get('button').contains('Save credentials').click()

          cy.get('h1').should('contain', 'Switch payment service provider')
        })

        it('should allow providing 3DS flex credentials', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubsForSwitchingNotStarted(),
            gatewayAccountStubs.postCheckWorldpay3dsFlexCredentials({
              gatewayAccountId,
              result: 'valid',
              organisational_unit_id: organisationalUnitId,
              issuer,
              jwt_mac_key: jwtMacKey
            }),
            gatewayAccountStubs.postUpdateWorldpay3dsFlexCredentials({
              gatewayAccountId,
              organisational_unit_id: organisationalUnitId,
              issuer,
              jwt_mac_key: jwtMacKey
            }),
            gatewayAccountStubs.patchUpdate3dsVersionSuccess(gatewayAccountId, 2)
          ])

          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)

          cy.get('.app-task-list__item').contains('Provide your Worldpay 3DS Flex credentials').click()
          cy.get('h1').should('contain', 'Your Worldpay 3DS Flex credentials')
          cy.get('.govuk-back-link').should('contain', 'Back to Switching payment service provider (PSP)')

          cy.get('#organisational-unit-id').type(organisationalUnitId)
          cy.get('#issuer').type(issuer)
          cy.get('#jwt-mac-key').type(jwtMacKey)
          cy.get('button').contains('Save credentials').click()

          cy.get('h1').should('contain', 'Switch payment service provider')
        })
      })

      describe('When credentials steps are completed', () => {
        it('should show steps as completed', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubs('smartpay', true, [
              {
                payment_provider: 'smartpay',
                state: 'ACTIVE',
                id: currentCredentialId,
                external_id: currentCredentialExternalId
              },
              {
                payment_provider: 'worldpay',
                state: 'ENTERED',
                id: switchingToCredentialId,
                external_id: switchingToCredentialExternalId
              }
            ],
            null,
            true,
            2)
          ])

          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
            .find('.app-task-list__tag').should('have.text', 'completed')
          cy.get('.app-task-list__item').eq(1).should('contain', 'Provide your Worldpay 3DS Flex credentials')
            .find('.app-task-list__tag').should('have.text', 'completed')
          cy.get('.app-task-list__item').eq(2).should('contain', 'Make a live payment to test your Worldpay PSP')
            .find('.app-task-list__tag').should('have.text', 'not started')
        })
      })

      describe('When Worldpay MOTO account', () => {
        describe('When switching is not started', () => {
          beforeEach(() => {
            cy.task('setupStubs', getUserAndAccountStubs('smartpay', true, [
              { payment_provider: 'smartpay', state: 'ACTIVE' },
              { payment_provider: 'worldpay', state: 'CREATED' }
            ],
            null,
            null,
            null,
            true))
          })

          it('should have task list for Worldpay with correct tags', () => {
            cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)

            cy.get('.app-task-list>li').eq(0).should('contain', 'Get ready to switch PSP')
              .within(() => {
                cy.get('.app-task-list__item').should('have.length', 2)
                cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
                  .find('.app-task-list__tag').should('have.text', 'not started')
                cy.get('.app-task-list__item').eq(1).should('contain', 'Make a live payment to test your Worldpay PSP')
                  .find('.app-task-list__tag').should('have.text', 'cannot start yet')
              })
            cy.get('button').contains('Switch to Worldpay').should('have.disabled')
          })
        })

        describe('When account is linked', () => {
          beforeEach(() => {
            cy.task('setupStubs', [
              ...getUserAndAccountStubs(
                'smartpay',
                true,
                [
                  { payment_provider: 'smartpay', state: 'ACTIVE' },
                  { payment_provider: 'worldpay', state: 'ENTERED' }
                ],
                null,
                null,
                null,
                true
              )
            ])
          })

          it('should should the task list with the link Worldpay account step complete', () => {
            cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
            cy.get('.app-task-list__item').eq(0).should('contain', 'Link your Worldpay account with GOV.UK Pay')
              .find('.app-task-list__tag').should('have.text', 'completed')
            cy.get('.app-task-list__item').eq(1).should('contain', 'Make a live payment to test your Worldpay PSP')
              .find('.app-task-list__tag').should('have.text', 'not started')
          })
        })
      })

      describe('PSP integration verified with live payment', () => {
        it('should now be clickable and navigate to the verify PSP integration page', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubs('smartpay', true, [
              {
                payment_provider: 'smartpay',
                state: 'ACTIVE',
                id: currentCredentialId,
                external_id: currentCredentialExternalId
              },
              {
                payment_provider: 'worldpay',
                state: 'ENTERED',
                id: switchingToCredentialId,
                external_id: switchingToCredentialExternalId
              }
            ],
            null,
            true,
            2),
            connectorChargeStubs.postCreateChargeSuccess({
              gateway_account_id: gatewayAccountId,
              charge_id: 'a-valid-charge-external-id',
              next_url: '/should_follow_to_payment_page'
            })
          ])

          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('.app-task-list__item').contains('Make a live payment to test your Worldpay PSP').click()
          cy.get('h1').should('contain', 'Test the connection between Worldpay and GOV.UK Pay')
          cy.get('.govuk-back-link').should('contain', 'Back to Switching payment service provider (PSP)')

          cy.get('button').contains('Continue to live payment').click()
          cy.location().should((location) => {
            expect(location.pathname).to.eq('/should_follow_to_payment_page')
          })
        })

        it('returning with a failed payment should present an error', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubs('smartpay', true, [
              {
                payment_provider: 'smartpay',
                state: 'ACTIVE',
                id: currentCredentialId,
                external_id: currentCredentialExternalId
              },
              {
                payment_provider: 'worldpay',
                state: 'ENTERED',
                id: switchingToCredentialId,
                external_id: switchingToCredentialExternalId
              }
            ],
            null,
            true,
            2),
            connectorChargeStubs.getChargeSuccess({
              gateway_account_id: gatewayAccountId,
              charge_id: 'a-valid-charge-external-id',
              status: 'cancelled',
              next_url: '/should_follow_to_payment_page'
            })
          ])
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration/callback`)

          cy.get('.govuk-error-summary__body').first().contains('Please check your Worldpay credentials and try making another payment.')
          cy.get('.govuk-back-link').click()
        })

        it('returning with a successful payment should present completion message', () => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubs('smartpay', true, [
              {
                payment_provider: 'smartpay',
                state: 'ACTIVE',
                id: currentCredentialId,
                external_id: currentCredentialExternalId
              },
              {
                payment_provider: 'worldpay',
                state: 'VERIFIED_WITH_LIVE_PAYMENT',
                id: switchingToCredentialId,
                external_id: switchingToCredentialExternalId
              }
            ],
            null,
            true,
            2),
            connectorChargeStubs.postCreateChargeSuccess({
              gateway_account_id: gatewayAccountId,
              charge_id: 'a-valid-charge-external-id',
              next_url: '/should_follow_to_payment_page'
            }),
            connectorChargeStubs.getChargeSuccess({
              gateway_account_id: gatewayAccountId,
              charge_id: 'a-valid-charge-external-id',
              status: 'success',
              next_url: '/should_follow_to_payment_page'
            }),
            gatewayAccountStubs.patchUpdateCredentialsSuccess(gatewayAccountId, switchingToCredentialId)
          ])

          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('.app-task-list__item').contains('Make a live payment to test your Worldpay PSP').click()
          cy.get('button').contains('Continue to live payment').click()
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration/callback`)
          cy.get('.govuk-notification-banner__content').contains('Your live payment has succeeded')
        })
      })

      describe('Switch PSP', () => {
        beforeEach(() => {
          const userAndAccountStubs = getUserAndAccountStubs('smartpay', true, [
            {
              payment_provider: 'smartpay',
              state: 'ACTIVE',
              id: currentCredentialId,
              external_id: currentCredentialExternalId
            },
            {
              payment_provider: 'worldpay',
              state: 'VERIFIED_WITH_LIVE_PAYMENT',
              id: switchingToCredentialId,
              external_id: switchingToCredentialExternalId
            }
          ],
          null,
          true,
          2)
          cy.task('setupStubs', [
            ...userAndAccountStubs,
            gatewayAccountStubs.postSwitchPspSuccess(gatewayAccountId)
          ])
        })

        it('submits and navigates through to success page with appropriate message', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('button').contains('Switch to Worldpay').click()
          cy.get('.govuk-notification-banner__heading').contains('You\'ve switched payment service provider')
          cy.get('.govuk-notification-banner__content').contains('Your service is now taking payments through Worldpay. You can still process refunds of previous payments through Smartpay.')
        })
      })

      describe('Switched PSP', () => {
        beforeEach(() => {
          cy.task('setupStubs', getUserAndAccountStubs('smartpay', true, [
            {
              payment_provider: 'smartpay',
              state: 'ACTIVE',
              external_id: 'a-valid-external-id-smartpay',
              active_start_date: '2018-05-03T00:00:00.000Z'
            },
            {
              payment_provider: 'worldpay',
              state: 'RETIRED',
              active_end_date: '2018-05-03T00:00:00.000Z',
              external_id: 'a-valid-external-id-worldpay'
            }
          ],
          null,
          true,
          2))
        })

        it('sets transitioned text on the old psp page', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/settings`)
          cy.get('a').contains('Old PSP - Worldpay').click()
          cy.get('#switched-psp-status').should('contain', 'This service is taking payments with Smartpay. It switched from using Worldpay on 3 May 2018')
        })

        it('sets transitioned text on the your psp page for new provider', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/settings`)
          cy.get('a').contains('Your PSP - Smartpay').click()
          cy.get('#switched-psp-status').should('contain', 'This service started taking payments with Smartpay on 3 May 2018.')
        })
      })
    })

    describe('When switching to Stripe', () => {
      describe('Switching page', () => {
        beforeEach(() => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubs('smartpay', true, [
              { payment_provider: 'smartpay', state: 'ACTIVE' },
              { payment_provider: 'stripe', state: 'CREATED' }
            ]),
            stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
              gatewayAccountId
            })
          ])
        })

        it('shows Stripe specific tasks', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('.govuk-heading-l').should('contain', 'Switch payment service provider (PSP)')

          cy.get('strong[id="Add organisation website address-status"]').should('contain', 'not started')
          cy.get('span').contains('Add organisation website address').should('exist')
          cy.get('strong[id="Provide your bank details-status"]').should('contain', 'not started')
          cy.get('span').contains('Provide your bank details').should('exist')
          cy.get('strong[id="Provide details about your responsible person-status"]').should('contain', 'not started')
          cy.get('span').contains('Provide details about your responsible person').should('exist')
          cy.get('strong[id="Provide details about the director of your organisation-status"]').should('contain', 'not started')
          cy.get('span').contains('Provide details about the director of your organisation').should('exist')
          cy.get('strong[id="Provide your organisation’s VAT number-status"]').should('contain', 'not started')
          cy.get('span').contains('Provide your organisation’s VAT number').should('exist')
          cy.get('strong[id="Provide your Company registration number-status"]').should('contain', 'not started')
          cy.get('span').contains('Provide your Company registration number').should('exist')
          cy.get('strong[id="Confirm your organisation details-status"]').should('contain', 'not started')
          cy.get('span').contains('Confirm your organisation details').should('exist')
          cy.get('strong[id="Upload a government entity document-status"]').should('contain', 'not started')
          cy.get('span').contains('Upload a government entity document').should('exist')
          cy.get('strong[id="Make a live payment to test your Stripe PSP-status"]').should('contain', 'cannot start yet')
          cy.get('span').contains('Make a live payment to test your Stripe PSP').should('exist')
        })
      })

      describe('Stripe pages show contextually appropriate information for the switch flow', () => {
        beforeEach(() => {
          cy.task('setupStubs', [
            ...getUserAndAccountStubs(
              'smartpay',
              true,
              [
                { payment_provider: 'smartpay', state: 'ACTIVE' },
                {
                  payment_provider: 'stripe',
                  state: 'CREATED',
                  credentials: { stripe_account_id: 'a-valid-stripe-account-id' }
                }
              ]
            ),
            stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
              gatewayAccountId
            })
          ])
        })

        it('loads the `VAT number` page', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('a').contains('Provide your organisation’s VAT number').click()
          cy.get('#navigation-menu-switch-psp').parent().should('have.class', 'govuk-!-font-weight-bold')
          cy.get('a').contains('Back to Switching payment service provider (PSP)').should('exist')
        })

        it('loads the `check org details` page', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
          cy.get('a').contains('Confirm your organisation details').click()
          cy.get('#navigation-menu-switch-psp').parent().should('have.class', 'govuk-!-font-weight-bold')
          cy.get('a').contains('Back to Switching payment service provider (PSP)').should('exist')
          cy.get('h1').contains('Check your organisation’s details')
        })
      })

      describe('Switch page unlocks appropriately', () => {
        beforeEach(() => {
          const merchantDetails = {
            url: 'https://www.valid-url.com'
          }
          cy.task('setupStubs', [
            ...getUserAndAccountStubs(
              'smartpay',
              true,
              [
                { payment_provider: 'smartpay', state: 'ACTIVE' },
                {
                  payment_provider: 'stripe',
                  state: 'VERIFIED_WITH_LIVE_PAYMENT',
                  credentials: { stripe_account_id: 'a-valid-stripe-account-id' }
                }
              ],
              merchantDetails
            ),
            stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
              gatewayAccountId,
              bankAccount: true,
              vatNumber: true,
              companyNumber: true,
              responsiblePerson: true,
              director: true,
              organisationDetails: true,
              governmentEntityDocument: true
            })
          ])
        })
        it('all steps are complete', () => {
          cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)

          cy.get('strong[id="Add organisation website address-status"]').should('contain', 'completed')
          cy.get('strong[id="Provide your bank details-status"]').should('contain', 'completed')
          cy.get('strong[id="Provide details about your responsible person-status"]').should('contain', 'completed')
          cy.get('strong[id="Provide details about the director of your organisation-status"]').should('contain', 'completed')
          cy.get('strong[id="Provide your organisation’s VAT number-status"]').should('contain', 'completed')
          cy.get('strong[id="Provide your Company registration number-status"]').should('contain', 'completed')
          cy.get('strong[id="Confirm your organisation details-status"]').should('contain', 'completed')
          cy.get('strong[id="Upload a government entity document-status"]').should('contain', 'completed')
          cy.get('strong[id="Make a live payment to test your Stripe PSP-status"]').should('contain', 'completed')

          cy.get('button').contains('Switch to Stripe').should('not.be.disabled')
        })
      })
    })
  })
})
