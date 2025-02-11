const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const { WORLDPAY, SANDBOX } = require('@models/constants/payment-providers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'
const CREDENTIAL_EXTERNAL_ID = 'worldpay-credentials-xyz'

const VALID_MERCHANT_CODE = 'AVALIDMERCHANTCODE'
const VALID_MOTO_MERCHANT_CODE = 'AVALIDMERCHANTCODEMOTO'
const VALID_WORLDPAY_USERNAME = 'worldpay-user'
const VALID_ORGANISATIONAL_UNIT_ID = '5bd9b55e4444761ac0af1c80' // pragma: allowlist secret
const VALID_ISSUER = '5bd9e0e4444dce15fed8c940' // pragma: allowlist secret

const setupStubs = (opts = {}, additionalStubs = []) => {
  const options = Object.assign({}, {
    role: 'admin',
    paymentProvider: WORLDPAY,
    credentials: {},
    allowMoto: false,
    worldpay3dsFlex: undefined
  }, opts)

  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: options.paymentProvider,
      gateway_account_credentials: [{
        payment_provider: options.paymentProvider,
        credentials: options.credentials,
        external_id: CREDENTIAL_EXTERNAL_ID
      }],
      worldpay_3ds_flex: options.worldpay3dsFlex,
      allow_moto: options.allowMoto
    }),
    ...additionalStubs
  ])
}

describe('Worldpay details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Worldpay details landing page', () => {
    describe('for an admin user', () => {
      describe('for a MOTO service', () => {
        describe('when some tasks are incomplete', () => {
          beforeEach(() => {
            setupStubs({ allowMoto: true })
          })

          it('should show the correct heading and title', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('h1').should('contain', 'Worldpay details')
            cy.title().should('eq', 'Worldpay details - Settings - My cool service - GOV.UK Pay')
          })

          it('should show worldpay settings in the settings navigation', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.service-settings-nav')
              .find('li')
              .contains('Worldpay details')
              .then(li => {
                cy.wrap(li)
                  .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
                  .parent().should('have.class', 'service-settings-nav__li--active')
              })
          })

          it('should show the list of tasks with only the "Link your account to Worldpay" task', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-task-list').within(() => {
              cy.get('.govuk-task-list__item').eq(0).within(() => {
                cy.get('a')
                  .should('contain.text', 'Link your Worldpay account with GOV.UK Pay')
                  .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)
                cy.get('.govuk-task-list__status').within(() => {
                  cy.get('strong.govuk-tag.govuk-tag--blue').should('contain.text', 'Not yet started')
                })
              })

              cy.get('.govuk-task-list__item').eq(1).should('not.exist')
            })
          })
        })

        describe('when all tasks are completed', () => {
          beforeEach(() => {
            setupStubs({
              credentials: {
                one_off_customer_initiated: { merchant_code: VALID_MOTO_MERCHANT_CODE, username: VALID_WORLDPAY_USERNAME }
              },
              allowMoto: true
            })
          })

          it('should show the correct heading and title', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('h1').should('contain', 'Worldpay details')
            cy.title().should('eq', 'Worldpay details - Settings - My cool service - GOV.UK Pay')
          })

          it('should show the single completed task card', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-summary-card').eq(0).within(() => {
              cy.get('.govuk-summary-card__title-wrapper > h2').should('contain', 'Account credentials')

              cy.get('.govuk-summary-list__row').eq(0).within(() => {
                cy.get('dt').should('contain.text', 'Merchant code')
                cy.get('dd').should('contain.text', VALID_MOTO_MERCHANT_CODE)
              })

              cy.get('.govuk-summary-list__row').eq(1).within(() => {
                cy.get('dt').should('contain.text', 'Username')
                cy.get('dd').should('contain.text', VALID_WORLDPAY_USERNAME)
              })

              cy.get('.govuk-summary-list__row').eq(2).within(() => {
                cy.get('dt').should('contain.text', 'Password')
                cy.get('dd').should('contain.text', '●●●●●●●●')
              })
            })

            cy.get('.govuk-summary-card').eq(1).should('not.exist')
          })

          it('should show the link to edit the details', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-summary-card').within(() => {
              cy.get('.govuk-summary-card__actions > a.govuk-link').should('contain', 'Change')
                .should('have.attr', 'href',
                  `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)
            })
          })

          it('should only show redacted passwords in task cards', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-summary-card')
              .each(card => {
                cy.wrap(card).get('.govuk-summary-list__row').filter(':contains("Password")').within(() => {
                  cy.get('dd').should('contain.text', '●●●●●●●●')
                })
              })
          })
        })
      })

      describe('for a non-MOTO service', () => {
        describe('when the "Link your Worldpay account" task is incomplete', () => {
          beforeEach(() => {
            setupStubs()
          })

          it('should show the "Link your Worldpay account" task as "Not yet started"', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-task-list').within(() => {
              cy.get('.govuk-task-list__item').eq(0).within(() => {
                cy.get('a')
                  .should('contain.text', 'Link your Worldpay account with GOV.UK Pay')
                  .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)
                cy.get('.govuk-task-list__status').within(() => {
                  cy.get('strong.govuk-tag.govuk-tag--blue').should('contain.text', 'Not yet started')
                })
              })
            })
          })

          it('should show the "Configure 3DS" task as "Cannot start yet"', () => {
            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-task-list').within(() => {
              cy.get('.govuk-task-list__item').eq(1).within(() => {
                cy.get('a').should('contain.text', 'Configure 3DS')
                cy.get('.govuk-task-list__name-and-hint')
                  .should('contain.text', 'Configure 3DS')
                  .should('not.have.attr', 'href')
                cy.get('.govuk-task-list__status').within(() => {
                  cy.get('strong.govuk-tag.govuk-tag--blue').should('contain.text', 'Not yet started')
                })
              })
            })
          })
        })

        describe('when the "Link your Worldpay account" task is complete', () => {
          describe('when the "Configure 3DS task" is incomplete', () => {
            beforeEach(() => {
              setupStubs({
                credentials: {
                  one_off_customer_initiated: {
                    merchant_code: VALID_MERCHANT_CODE,
                    username: VALID_WORLDPAY_USERNAME
                  }
                }
              })
            })

            it('should show the "Link your Worldpay account" task as "Completed"', () => {
              cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

              cy.get('.govuk-task-list').within(() => {
                cy.get('.govuk-task-list__item').eq(0).within(() => {
                  cy.get('a')
                    .should('contain.text', 'Link your Worldpay account with GOV.UK Pay')
                    .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

                  cy.get('.govuk-task-list__status')
                    .should('contain.text', 'Completed')
                    .within(() => {
                      cy.get('strong.govuk-tag.govuk-tag--grey').should('not.exist')
                    })
                })
              })
            })

            it('should show the task list with the "Configure 3DS" task as "Not yet started"', () => {
              cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

              cy.get('.govuk-task-list__item').eq(1).within(() => {
                cy.get('a')
                  .should('contain.text', 'Configure 3DS')
                  .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

                cy.get('.govuk-task-list__status').within(() => {
                  cy.get('strong.govuk-tag.govuk-tag--blue').should('contain.text', 'Not yet started')
                })
              })
            })
          })

          describe('when the "Configure 3DS task" is complete', () => {
            beforeEach(() => {
              setupStubs({
                credentials: {
                  one_off_customer_initiated: {
                    merchant_code: VALID_MERCHANT_CODE,
                    username: VALID_WORLDPAY_USERNAME
                  }
                },
                worldpay3dsFlex: {
                  organisational_unit_id: VALID_ORGANISATIONAL_UNIT_ID,
                  issuer: VALID_ISSUER
                }
              })
            })

            it('should show the completed task cards', () => {
              cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

              cy.get('.govuk-summary-card').eq(0).within(() => {
                cy.get('.govuk-summary-card__title-wrapper > h2').should('contain', 'Account credentials')

                cy.get('.govuk-summary-list__row').eq(0).within(() => {
                  cy.get('dt').should('contain.text', 'Merchant code')
                  cy.get('dd').should('contain.text', 'AVALIDMERCHANTCODE')
                })

                cy.get('.govuk-summary-list__row').eq(1).within(() => {
                  cy.get('dt').should('contain.text', 'Username')
                  cy.get('dd').should('contain.text', 'worldpay-user')
                })

                cy.get('.govuk-summary-list__row').eq(2).within(() => {
                  cy.get('dt').should('contain.text', 'Password')
                  cy.get('dd').should('contain.text', '●●●●●●●●')
                })
              })

              cy.get('.govuk-summary-card').eq(1).within(() => {
                cy.get('.govuk-summary-card__title-wrapper > h2').should('contain', '3DS Flex credentials')

                cy.get('.govuk-summary-list__row').eq(0).within(() => {
                  cy.get('dt').should('contain.text', 'Organisational Unit ID')
                  cy.get('dd').should('contain.text', '5bd9b55e4444761ac0af1c80') // pragma: allowlist secret
                })

                cy.get('.govuk-summary-list__row').eq(1).within(() => {
                  cy.get('dt').should('contain.text', 'Issuer (API ID)')
                  cy.get('dd').should('contain.text', '5bd9e0e4444dce15fed8c940') // pragma: allowlist secret
                })

                cy.get('.govuk-summary-list__row').eq(2).within(() => {
                  cy.get('dt').should('contain.text', 'JWT MAC Key (API key)')
                  cy.get('dd').should('contain.text', '●●●●●●●●')
                })
              })
            })

            it('should show the links to edit the details', () => {
              cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

              cy.get('.govuk-summary-card').eq(0).within(() => {
                cy.get('.govuk-summary-card__actions > a.govuk-link').should('contain', 'Change')
                  .should('have.attr', 'href',
                    `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)
              })

              cy.get('.govuk-summary-card').eq(1).within(() => {
                cy.get('.govuk-summary-card__actions > a.govuk-link').should('contain', 'Change')
                  .should('have.attr', 'href',
                    `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)
              })
            })

            it('should only show redacted passwords in task cards', () => {
              cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

              cy.get('.govuk-summary-card')
                .each(card => {
                  cy.wrap(card).get('.govuk-summary-list__row').filter(':contains("Password")').within(() => {
                    cy.get('dd').should('contain.text', '●●●●●●●●')
                  })

                  cy.wrap(card).get('.govuk-summary-list__row').filter(':contains("JWT MAC Key")').within(() => {
                    cy.get('dd').should('contain.text', '●●●●●●●●')
                  })
                })
            })
          })
        })
      })
    })

    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund'
        })
      })

      it('should return a 403', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(403))
      })
    })

    describe('for a non-Worldpay account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund',
          paymentProvider: SANDBOX
        })
      })

      it('should return a 404', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(404))
      })

      it('should not show the Worldpay details link in the settings nav', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings`)

        cy.get('.service-settings-nav')
          .find('li')
          .should('not.contain', 'Worldpay details')
      })
    })
  })
})
