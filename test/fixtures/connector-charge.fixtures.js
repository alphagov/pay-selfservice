function validLinks (opts = {}) {
  return [{
    rel: 'next_url',
    method: 'GET',
    href: opts.nextUrl || 'https://payments.a-next-url.com'
  }]
}

function validChargeResponse (opts = {}) {
  const data = {
    charge_id: opts.chargeExternalId || 'a-valid-charge-external-id',
    state: {
      finished: opts.finished || true,
      status: opts.status || 'success'
    },
    links: validLinks(opts)
  }
  return data
}

module.exports = { validChargeResponse }
