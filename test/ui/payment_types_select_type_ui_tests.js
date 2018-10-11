var path = require('path')

var renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
var {TYPES} = require(path.join(__dirname, '/../../app/controllers/payment_types_controller.js'))

describe('The payment select type view', function () {
  it('should display the payment select type view', function () {
    var templateData = {
      allCardOption: {
        type: TYPES.ALL,
        selected: 'checked'
      },
      debitCardOption: {
        type: TYPES.DEBIT,
        selected: 'checked'
      },
      permissions: {
        'payment_types_read': true,
        'payment_types_update': true
      }
    }

    var body = renderTemplate('payment_types_select_type', templateData)

    body.should.containSelector('.page-title').withExactText('Card types')

    body.should.containSelector('#payment-types-all-type')
      .withAttribute('name', 'payment-types-card-type')
      .withAttribute('value', TYPES.ALL)
      .withAttribute('checked')

    body.should.containSelector('#payment-types-debit-type')
      .withAttribute('name', 'payment-types-card-type')
      .withAttribute('value', TYPES.DEBIT)
      .withAttribute('checked')

    body.should.containSelector('#payment-types-continue-button')
      .withAttribute('class', 'govuk-button')
  })

  it('should not display select type form without correct permission', function () {
    var templateData = {
      allCardOption: {
        type: TYPES.ALL,
        selected: 'checked'
      },
      debitCardOption: {
        type: TYPES.DEBIT,
        selected: 'checked'
      }
    }

    var body = renderTemplate('payment_types_select_type', templateData)

    body.should.not.containSelector('form#payment-types-card-type-selection-form')
  })
})
