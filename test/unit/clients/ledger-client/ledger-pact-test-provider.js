'use strict'

const { Pact } = require('@pact-foundation/pact')

const path = require('path')

const pactProvider = new Pact({
  consumer: 'selfservice',
  provider: 'ledger',
  log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 2,
  pactfileWriteMode: 'merge'
})
module.exports = {
  addInteraction: function (pact) {
    return pactProvider.addInteraction(pact)
  },
  setup: function () {
    return pactProvider.setup()
  },
  verify: function () {
    return pactProvider.verify()
  },
  finalize: function () {
    return pactProvider.finalize()
  }
}
