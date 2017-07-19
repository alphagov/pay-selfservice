var path = require('path')
var renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
var _ = require('lodash')

var {TYPES} = require(path.join(__dirname, '/../../app/controllers/payment_types_controller.js'))

var templateData = {
  acceptedType: TYPES.ALL,
  isAcceptedTypeAll: true,
  isAcceptedTypeDebit: false,
  error: '',
  brands: {
    'id': 'payment-types-visa-brand',
    'value': 'visa',
    'label': 'Visa',
    'available': true,
    'selected': true
  },
  permissions: {
    'payment_types_read': true
  }
}

describe('The payment types summary view', function () {
  it('should display the manage button', function () {
    var model = _.extend({}, templateData)

    var body = renderTemplate('payment_types_summary', model)

    body.should.containSelector('a#payment-types-manage-button')
      .withAttribute('class', 'button')
      .withAttribute('href', '/payment-types/select-type')
      .withText('Manage')
  })

  it('should display a message stating debit and credit cards are currently accepted', function () {
    var model = _.extend({}, templateData, {
      isAcceptedTypeAll: true,
      isAcceptedTypeDebit: false
    })

    var body = renderTemplate('payment_types_summary', model)

    body.should.containSelector('p#payment-types-accept-all-types-message')
      .withText('Debit and credit cards are currently accepted')
  })

  it('should display a message stating debit cards only accepted', function () {
    var model = _.extend({}, templateData, {
      isAcceptedTypeAll: false,
      isAcceptedTypeDebit: true
    })

    var body = renderTemplate('payment_types_summary', model)

    body.should.containSelector('p#payment-types-accept-debit-types-message')
      .withText('Debit cards only accepted')
  })

  it('should grey out unavailable options', function () {
    var model = _.extend({}, templateData)
    model['brands'] = _.extend({}, templateData['brands'], {
      'available': false
    })

    var body = renderTemplate('payment_types_summary', model)

    body.should.containSelector('tr#payment-types-visa-brand.payment-types-not-available')

    body.should.containSelector('td.table-data-accept span')
      .withText('Not available')
  })

  it('should display selected options as Yes', function () {
    var model = _.extend({}, templateData)
    model['brands'] = _.extend({}, templateData['brands'], {
      'available': true,
      'selected': true
    })

    var body = renderTemplate('payment_types_summary', model)

    body.should.containSelector('td.table-data-label img')
      .withAttribute('src', '/public/images/visa-color.png')

    body.should.containSelector('span.payment-types-selected')
      .withText('Yes')
  })

  it('should display unselected options as No', function () {
    var model = _.extend({}, templateData)
    model['brands'] = _.extend({}, templateData['brands'], {
      'available': true,
      'selected': false
    })

    var body = renderTemplate('payment_types_summary', model)

    body.should.containSelector('td.table-data-label img')
      .withAttribute('src', '/public/images/visa-color.png')

    body.should.containSelector('span.payment-types-not-selected')
      .withText('No')
  })
})
