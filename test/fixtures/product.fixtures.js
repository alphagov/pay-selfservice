'use strict'

function validCreateProductRequest(opts = {}) {
  const data = {
    gateway_account_id: opts.gatewayAccountId || 'd5gzn',
    pay_api_token: opts.payApiToken || 'pay-api-token',
    name: opts.name || 'A Product Name',
    type: opts.type || 'DEMO',
    language: opts.language || 'en'
  }
  if (opts.type === 'ADHOC') data.reference_enabled = opts.reference_enabled || false
  if (opts.description) data.description = opts.description
  if (opts.returnUrl) data.return_url = opts.returnUrl
  if (opts.price) data.price = opts.price
  if (opts.service_name_path) data.service_name_path = opts.service_name_path
  if (opts.product_name_path) data.product_name_path = opts.product_name_path
  if (opts.reference_enabled) {
    data.reference_label = opts.reference_label
    data.reference_hint = opts.reference_hint
  }
  if (opts.amount_hint) {
    data.amount_hint = opts.amount_hint
  }
  if (opts.metadata) data.metadata = opts.metadata

  return data
}

function validUpdateProductRequest(opts = {}) {
  const data = {
    name: opts.name || 'A payment link',
    reference_enabled: opts.reference_enabled || false,
  }

  if (opts.description) data.description = opts.description
  if (opts.price !== undefined) data.price = opts.price
  if (opts.reference_label) data.reference_label = opts.reference_label
  if (opts.reference_hint !== undefined) data.reference_hint = opts.reference_hint
  if (opts.amount_hint !== undefined) data.amount_hint = opts.amount_hint
  if (opts.metadata) data.metadata = opts.metadata

  return data
}

function validCreatePaymentResponse (opts = {}) {
  const data = {
    external_id: opts.external_id || 'b9tijg',
    product_external_id: opts.product_external_id || 'mekna7',
    next_url: opts.next_url || `http://service.url/next`,
    status: opts.status || 'CREATED',
    govuk_status: opts.govuk_status || 'success',
    _links: opts.links
  }
  if (opts.metadata) {
    data.metadata = opts.metadata
  }
  if (!data._links) {
    data._links = [{
      href: `http://products.url/v1/api/payments/${(data.external_id)}`,
      rel: 'self',
      method: 'GET'
    }, {
      href: `http://frontend.url/charges/${(data.external_id)}`,
      rel: 'next',
      method: 'POST'
    }]
  }

  return data
}

function validProductResponse(opts = {}) {
  const data = {
    external_id: opts.external_id || 'cf3hp2',
    type: opts.type || 'ADHOC',
    gateway_account_id: opts.gateway_account_id || 99,
    name: opts.name || 'A Product Name',
    language: opts.language || 'en',
    _links: opts.links
  }

  if (opts.reference_enabled !== undefined) data.reference_enabled = opts.reference_enabled
  if (opts.reference_label) data.reference_label = opts.reference_label
  if (opts.reference_hint) data.reference_hint = opts.reference_hint
  if (opts.description) data.description = opts.description
  if (opts.return_url) data.return_url = opts.return_url
  if (opts.price) data.price = opts.price
  if (opts.service_name_path) data.service_name_path = opts.service_name_path
  if (opts.product_name_path) data.product_name_path = opts.product_name_path
  if (opts.amount_hint) data.amount_hint = opts.amount_hint
  if (opts.metadata) data.metadata = opts.metadata
  if (!data._links) {
    data._links = [{
      href: `http://products.url/v1/api/products/${data.external_id}`,
      rel: 'self',
      method: 'GET'
    }, {
      href: `http://products-ui.url/pay/${data.external_id}`,
      rel: 'pay',
      method: 'GET'
    }]
    if (opts.service_name_path && opts.product_name_path) {
      data._links.push({
        href: `http://products-ui.url/redirect/${opts.service_name_path}/${opts.product_name_path}`,
        rel: 'friendly',
        method: 'GET'
      })
    }
  }

  return data
}

function validAdhocProductResponse(opts = {}) {
  const adhocProductOpts = {
    type: 'ADHOC',
    reference_enabled: false,
    service_name_path: 'service_name',
    product_name_path: 'product_name',
    return_url: 'a-return-url',
    ...opts,
  }
  return validProductResponse(adhocProductOpts)
}

module.exports = {
  validCreateProductRequest,
  validUpdateProductRequest,
  validCreatePaymentResponse,
  validProductResponse,
  validAdhocProductResponse
}
