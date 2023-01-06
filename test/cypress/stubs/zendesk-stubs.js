'use strict'

const { stubBuilder } = require('./stub-builder')

function createTicketSuccess () {
  return stubBuilder('POST', '/zendesk/tickets.json', 200)
}

module.exports = {
  createTicketSuccess
}
