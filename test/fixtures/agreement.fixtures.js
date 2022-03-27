'use strict'

function buildCardDetails(opts) {
  const billingAddressOpts = opts.billing_address || {}

  return {
    last_digits_card_number: opts.last_digits_card_number || '0002',
    cardholder_name: opts.cardholder_name || 'Test User',
    expiry_date: opts.expiry_date || '08/23',
    card_brand: opts.card_brand || 'Visa',
    billing_address: {
      line1: billingAddressOpts.line1 || 'address line 1',
      line2: billingAddressOpts.line2 || 'address line 2',
      postcode: billingAddressOpts.postcode || 'AB1A 1AB',
      city: billingAddressOpts.city || 'London',
      country: billingAddressOpts.country || 'GB'
    }
  }
}

// @TODO(sfount) propose recording enough from psps to put the additional data
// that could be included here
// __user last provided consent when this payment instrument was created and set to active
function buildPaymentInstrument(opts) {
  return {
    method: opts.method || 'CARD',
    created_date: opts.created_date || '2022-03-01T10:20:00:00Z',
    gateway_expiration_date: opts.gateway_expiration_date || '2022-03-01T10:20:00:00Z',
    card_details: buildCardDetails(opts.card_details)
  }
}

function buildAgreement (opts) {
  return {
    id: opts.id || 'agreement-external-identifier',
    reference: opts.reference || 'valid-reference',
    description: opts.description || 'Reason shown to paying user for taking agreement',

    // @TODO(sfount): complete rules about what and who can set active etc.
    // currently Connector setting external status
    // CREATED, ACTIVE, EXPIRED
    status: opts.status || 'ACTIVE',
    payment_instrument: buildPaymentInstrument(opts.payment_instrument),
    created_date: opts.created_date || '2022-03-01T10:20:00:00Z'
  }
}

module.exports = {
  validAgreementResponse: (opts = {}) => {
    return buildAgreement(opts)
  },
  validAgreementSearchResponse: (agreementOpts = [], opts = {}) => {
    const agreements = agreementOpts.map(buildAgreement)
    return {
      results: agreements,
      total: opts.total || agreements.length,
      count: agreements.length,
      page: opts.page || 1
    }
  }
}