const userStubs = require('../../stubs/user-stubs')

describe('My profile page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const testPhoneNumber = '+441234567890'

  describe('accessibility check', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, telephoneNumber: null })
      ])
    })

    it('should check accessibility of the page', { defaultCommandTimeout: 15000 }, () => {
      cy.visit('/my-profile')
      cy.a11yCheck()
    })
  })

  describe('User does not have telephone number', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, telephoneNumber: null })
      ])
    })

    it('should show telephone number row with link to add number', () => {
      cy.visit('/my-profile')

      cy.get('[data-cy=telephone-number-row]').should('exist')
      cy.get('[data-cy=telephone-number-row]>dd').within(() => {
        cy.get('a')
          .should('contain', 'Add mobile number')
          .click()
      })
      cy.location('pathname').should('eq', '/my-profile/phone-number')
    })
  })

  describe('User has a telephone number', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, telephoneNumber: testPhoneNumber })
      ])
    })

    it('should show telephone number row', () => {
      cy.visit('/my-profile')

      cy.get('[data-cy=telephone-number-row]').should('exist')
      cy.get('[data-cy=telephone-number-row]>dd').should('contain', testPhoneNumber)
    })

    it('should have link to change phone number', () => {
      cy.visit('/my-profile')

      cy.get('[data-cy=telephone-number-row]>dd').within(() => {
        cy.get('a')
          .should('contain', 'Change')
          .click()
      })
      cy.location('pathname').should('eq', '/my-profile/phone-number')
    })
  })
})
