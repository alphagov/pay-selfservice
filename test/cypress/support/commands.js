Cypress.Commands.add('setEncryptedCookies', (userId, pageData = {}) => {
  cy.task('getCookies', {
    user_external_id: userId,
    pageData
  }).then(cookies => {
    cy.setCookie('session', cookies.encryptedSessionCookie)
  })
})
