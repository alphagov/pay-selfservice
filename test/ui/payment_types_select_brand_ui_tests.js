var should = require('chai').should();
var renderTemplate = require(__dirname + '/../test_helpers/html_assertions.js').render;
var paths = require(__dirname + '/../../app/paths.js');
var _ = require('lodash');

var {TYPES}  = require(__dirname + '/../../app/controllers/payment_types_controller.js');

var templateData = {
  acceptedType: TYPES.ALL,
  isAcceptedTypeAll: true,
  isAcceptedTypeDebit: false,
  error: '',
  brands: {
    "id": "payment-types-visa-brand",
    "value": 'visa',
    "label": 'Visa',
    "available": true,
    "selected": true
  },
  permissions: {
    'payment_types_read': true,
    'payment_types_update': true
  }
};

describe('The payment select brand view', function () {
  it('should display the main form elements', function () {

    var model = _.extend({}, templateData);

    var body = renderTemplate('payment_types_select_brand', model);

    body.should.containSelector('form#payment-types-card-brand-selection-form')
      .withAttribute('method', 'post')
      .withAttribute('action', '/payment-types/select-brand');

    body.should.containSelector('input#accepted-card-type')
      .withAttribute('name', 'acceptedType')
      .withAttribute('type', 'hidden')
      .withAttribute('value', 'ALL');

    body.should.containSelector('a#payment-types-cancel-link')
      .withAttribute('href', '/payment-types/summary');
  });

  it('should display a message stating debit and credit cards have been chosen', function () {

    var model = _.extend({}, templateData, {
      isAcceptedTypeAll: true,
      isAcceptedTypeDebit: false
    });

    var body = renderTemplate('payment_types_select_brand', model);

    body.should.containSelector('p#payment-types-accept-all-types-message')
      .withText('You have chosen to accept debit and credit cards');
  });

  it('should display a message stating debit cards only have been chosen', function () {

    var model = _.extend({}, templateData, {
      isAcceptedTypeAll: false,
      isAcceptedTypeDebit: true
    });

    var body = renderTemplate('payment_types_select_brand', model);

    body.should.containSelector('p#payment-types-accept-debit-types-message')
      .withText('You have chosen to only accept debit cards');
  });

  it('should grey out unavailable options', function () {

    var model = _.extend({}, templateData);
    model['brands'] = _.extend({}, templateData['brands'], {
      "available": false
    });

    var body = renderTemplate('payment_types_select_brand', model);

    body.should.containSelector('tr#payment-types-visa-brand.payment-types-not-available');

    body.should.containSelector('td.table-data-accept span')
      .withText('Not available')

  });

  it('should not grey out available options', function () {

    var model = _.extend({}, templateData);
    model['brands'] = _.extend({}, templateData['brands'], {
      "available": true
    });

    var body = renderTemplate('payment_types_select_brand', model);

    body.should.containSelector('td.table-data-label img')
      .withAttribute('src', '/public/images/visa-color.png');

    body.should.containSelector('input.payment-types-checkbox')
      .withAttribute('type', 'checkbox')
      .withAttribute('name', 'acceptedBrands')
      .withAttribute('value', 'visa');
  });

  it('should display an error when at least one card brand has not been selected', function () {

    var model = _.extend({}, templateData, {
      'error': 'You must choose to accept at least one card brand to continue'
    });

    var body = renderTemplate('payment_types_select_brand', model);

    body.should.containSelector('#payment-types-error-message')
      .withText('You must choose to accept at least one card brand to continue')
  });

  it('should not display select brand form without correct permission', function () {
    var templateData = {
      acceptedType: TYPES.ALL,
      isAcceptedTypeAll: true,
      isAcceptedTypeDebit: false,
      error: '',
      brands: {
        "id": "payment-types-visa-brand",
        "value": 'visa',
        "label": 'Visa',
        "available": true,
        "selected": true
      }
    };
    var model = _.extend({}, templateData);


    var body = renderTemplate('payment_types_select_brand', model);

    body.should.not.containSelector('form#payment-types-card-brand-selection-form');
  });
});
