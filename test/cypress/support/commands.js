Cypress.Commands.add('setEncryptedCookies', (userId, gatewayAccountId) => {
  cy.task('getCookies', {
    user_external_id: userId,
    gateway_account_id: gatewayAccountId
  }).then(cookies => {
    cy.setCookie('session', cookies.encryptedSessionCookie)
    cy.setCookie('gateway_account', cookies.encryptedGatewayAccountCookie)
  })
})
