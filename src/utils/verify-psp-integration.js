'use strict'

const VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY = 'verify_psp_integration_charge_external_id'

function filterNextUrl (charge = {}) {
  const nextUrlEntry = charge.links &&
    charge.links.filter((link) => link.rel === 'next_url')[0]

  return nextUrlEntry && nextUrlEntry.href
}

module.exports = {
  VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY,
  filterNextUrl
}
