const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('My profile page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Purchase a positron projection permit'
  const testPhoneNumber = '+441234567890'

  describe('User does not have telephone number', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, telephoneNumber: null }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId })
      ])
    })

    it('should not show telephone number row', () => {
      cy.visit('/my-profile')
      cy.get('[data-cy=telephone-number-row]').should('not.exist')
    })
  })

  describe('User has a telephone number', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, telephoneNumber: testPhoneNumber }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId })
      ])
    })

    it('should show telephone number row', () => {
      cy.visit('/my-profile')
      cy.get('[data-cy=telephone-number-row]').should('exist')
      cy.get('[data-cy=telephone-number-row]>dd').should('contain', testPhoneNumber)
    })
  })
})

