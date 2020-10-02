var displayConverter = require('../../../app/utils/display-converter')

describe('Display converter', () => {
  it('should add full_type to account if type is test', () => {
    let data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'sandbox'
      }
    }, {}, null)

    expect(data.currentGatewayAccount).toEqual({
      type: 'test',
      payment_provider: 'sandbox',
      full_type: 'Sandbox test'
    })
  })

  it(
    'should add full_type with value live to account if type is live',
    () => {
      let data = displayConverter({
        account: {
          type: 'live',
          payment_provider: 'worldpay'
        }
      }, {}, {})

      expect(data.currentGatewayAccount).toEqual({
        type: 'live',
        payment_provider: 'worldpay',
        full_type: 'live'
      })
    }
  )
})
