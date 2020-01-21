'use strict'

// NPM dependencies
const { Pact } = require('@pact-foundation/pact')

// Custom dependencies
const path = require('path')
const port = parseInt(process.env.LEDGER_URL.match(/\d+(\.\d+)?$/g)[0], 10)

const pactProvider = new Pact({
  consumer: 'selfservice',
  provider: 'ledger',
  port: port,
  log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 2,
  pactfileWriteMode: 'merge'
})
module.exports = {
  getPort: function () {
    return port
  },
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
