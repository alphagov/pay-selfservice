'use strict'

const { string } = require('@pact-foundation/pact').Matchers

function validPostChargeRequestRequest (opts = {}) {
  return {
    amount: opts.amount || 100,
    reference: opts.reference || 'a reference',
    description: opts.description || 'a description',
    return_url: opts.returnUrl || 'https://somewhere.gov.uk/rainbow/1',
    credential_id: opts.credential_id
  }
}

// this fixture is using matchers (string = type)
function validPostChargeRequestResponse (opts = {}) {
  return {
    charge_id: string('ch-ab2341da231434l'),
    amount: 100,
    reference: opts.reference || 'a reference',
    description: opts.description || 'a description',
    return_url: opts.returnUrl || 'https://somewhere.gov.uk/rainbow/1',
    state: opts.state || {
      status: 'created',
      finished: false
    },
    links: opts.links || [
      {
        href: string('https://connector.service.backend/v1/api/accounts/42/charges/ch-ab2341da231434l'),
        rel: 'self',
        method: 'GET'
      },
      {
        rel: 'refunds',
        href: string('url'),
        method: 'GET'
      },
      {
        href: string('http://Frontend/secure/1934c1cb-3337-41bd-9f4d-e5df77604f32'),
        rel: 'next_url',
        method: 'GET'
      },
      {
        href: string('http://frontend_connector/charge/'),
        rel: 'next_url_post',
        type: 'application/x-www-form-urlencoded',
        params: {
          chargeTokenId: string('token_1234567asdf')
        },
        method: 'POST'
      }
    ]
  }
}

function validGetChargeResponse (opts = {}) {
  return {
    state: opts.state || { status: 'started', finished: false },
    charge_id: opts.chargeId || 'ht439nfg2l1e303k0dmifrn4fc'
  }
}

module.exports = {
  validPostChargeRequestRequest,
  validPostChargeRequestResponse,
  validGetChargeResponse
}
