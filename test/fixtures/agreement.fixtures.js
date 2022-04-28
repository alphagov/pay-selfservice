'use strict'

function buildCardDetails(opts = {}) {
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

function buildPaymentInstrument(opts = {}) {
  return {
    method: opts.method || 'CARD',
    created_date: opts.created_date || '2022-03-01T01:00:00.000Z',
    gateway_expiration_date: opts.gateway_expiration_date || '2022-03-01T01:00:00.000Z',
    card_details: buildCardDetails(opts.card_details)
  }
}

function buildAgreement (opts = {}) {
  return {
    external_id: opts.external_id || 'agreement-external-identifier',
    reference: opts.reference || 'valid-reference',
    description: opts.description || 'Reason shown to paying user for taking agreement',
    status: opts.status || 'ACTIVE',
    created_date: opts.created_date || '2022-03-01T01:00:00.000Z',
    ...opts.payment_instrument !== false && { payment_instrument: buildPaymentInstrument(opts.payment_instrument )}
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