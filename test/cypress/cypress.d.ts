declare namespace Cypress {
  interface Chainable {
    setEncryptedCookies(userId: string, pageData?: Record<string, unknown>): Chainable<void>
    a11yCheck(excludeSelectors?: { exclude: string[] }): Chainable<void>
    createPaymentLinkWithTitle(title: string, url: string): Chainable<void>
    createPaymentLinkWithReference(title: string, url: string): Chainable<void>
  }
}
