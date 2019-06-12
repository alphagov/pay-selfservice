describe('Settings page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 'DIRECT_DEBIT:42'
  const serviceName = 'A Direct Debit Service'

  describe('should redirect to API keys if Direct Debit gateway', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: userExternalId,
            service_roles: [{
              service: {
                gateway_account_ids: [gatewayAccountId],
                name: serviceName
              }
            }]
          }
        },
        {
          name: 'getDirectDebitGatewayAccountSuccess',
          opts: {
            gateway_account_id: gatewayAccountId
          }
        }
      ])
    })

    it('response should be a 302 pointing to /api-keys', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.request({
        url: '/settings/',
        followRedirect: false // turn off following redirects
      })
        .then((resp) => {
          // redirect status code is 302
          expect(resp.status).to.eq(302)
          expect(resp.redirectedToUrl).to.contain('/api-keys')
        })
    })
  })
})
