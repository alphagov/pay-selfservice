declare namespace Cypress {
  interface Chainable {
    setEncryptedCookies(userId: string, pageData?: Record<string, unknown>): Chainable<void>
    a11yCheck(excludeSelectors?: { exclude: string[] }): Chainable<void>
  }
}
