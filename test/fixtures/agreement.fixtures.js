'use strict'

function buildCardDetails (opts = {}) {
  const billingAddressOpts = opts.billing_address || {}

  return {
    last_digits_card_number: opts.last_digits_card_number || '0002',
    first_digits_card_number: opts.first_digits_card_number || '424242',
    cardholder_name: opts.cardholder_name || 'Test User',
    expiry_date: opts.expiry_date || '08/23',
    card_brand: opts.card_brand || 'Visa',
    card_type: opts.card_type || 'DEBIT',
    billing_address: {
      line1: billingAddressOpts.line1 || 'address line 1',
      line2: billingAddressOpts.line2 || 'address line 2',
      postcode: billingAddressOpts.postcode || 'AB1A 1AB',
      city: billingAddressOpts.city || 'London',
      country: billingAddressOpts.country || 'GB'
    }
  }
}

function buildPaymentInstrument (opts = {}) {
  return {
    type: opts.type || 'CARD',
    created_date: opts.created_date || '2022-03-01T01:00:00.000Z',
    card_details: buildCardDetails(opts.card_details)
  }
}

function buildAgreement (opts = {}) {
  const data = {
    external_id: opts.external_id || 'agreement-external-identifier',
    service_id: opts.service_id || 'a-service-id',
    reference: opts.reference || 'valid-reference',
    description: opts.description || 'Reason shown to paying user for taking agreement',
    status: opts.status || 'ACTIVE',
    created_date: opts.created_date || '2022-03-01T01:00:00.000Z',
    ...opts.payment_instrument !== false && { payment_instrument: buildPaymentInstrument(opts.payment_instrument) }
  }
  if (opts.cancelledDate) {
    data.cancelled_date = opts.cancelledDate
  }
  if (opts.cancelledByUserEmail) {
    data.cancelled_by_user_email = opts.cancelledByUserEmail
  }
  return data
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
  },
  validAgreementNotFoundResponse: (opts = {}) => {
    return {
      code: 404,
      message: opts.message || 'HTTP 404 Not Found'
    }
  },
  validAgreementsNotFoundResponse: () => {
    return {
      results: [],
      total: 0,
      count: 0,
      page: 1
    }
  }
}
