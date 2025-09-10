declare namespace Cypress {
  interface Chainable {
    setEncryptedCookies(userId: string, pageData?: Record<string, unknown>): Chainable<void>
    a11yCheck(excludeSelectors?: { exclude: string[] }): Chainable<void>
    createPaymentLinkWithTitle(title: string, createLink: string): Chainable<void>
    createPaymentLinkWithReference(title: string, createLink: string): Chainable<void>
    createPaymentLinkWithAmount(title: string, createLink: string): Chainable<void>
    createPaymentLinkWithMetadata(title: string, createLink: string, columnHeader: string, cellConetent: string): Chainable<void>
  }
}
