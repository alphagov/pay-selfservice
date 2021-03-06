function validLinks (opts = {}) {
  return [{
    rel: 'next_url',
    method: 'GET',
    href: opts.next_url || 'https://payments.a-next-url.com'
  }]
}

function validChargeResponse (opts = {}) {
  const data = {
    charge_id: opts.charge_id || 'a-valid-charge-external-id',
    state: {
      finished: opts.finished || true,
      status: opts.status || 'success'
    },
    links: validLinks(opts)
  }
  return data
}

module.exports = { validChargeResponse }
