Cypress.Commands.add('setEncryptedCookies', (userId, pageData = {}) => {
  cy.task('getCookies', {
    user_external_id: userId,
    pageData
  }).then(cookies => {
    cy.setCookie('session', cookies.encryptedSessionCookie)
  })
})

Cypress.Commands.add('setEncryptedRegisterInviteCookies', (registerInvite, pageData = {}) => {
  cy.task('getRegisterInviteCookies', {
    email: registerInvite.email,
    code: registerInvite.code,
    pageData
  }).then(cookies => {
    cy.setCookie('register_invite', cookies.encryptedRegisterInviteCookie)
  })
})
