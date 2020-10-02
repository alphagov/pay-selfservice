'use strict'

const path = require('path')

const { render } = require(path.join(__dirname, '/../test-helpers/html-assertions'))

describe('The digital wallet views', () => {
  it(
    'should not display options if gateway does not support digital wallet',
    () => {
      const templateData = {
        permissions: {
          'payment_types_read': true,
          'payment_types_update': true
        }
      }
      const digitalWalletPages = ['digital-wallet/google-pay', 'digital-wallet/google-pay']
      digitalWalletPages.forEach(page => {
        const body = render(page, templateData)
        expect(body).containSelector('.pay-info-warning-box').withText('Sorry, we do not currently support Digital Wallets for your payment service provider.')
        expect(body).containNoSelectorWithText('Apple Pay')
        expect(body).containNoSelectorWithText('Google Pay')
      })
    }
  )
})
