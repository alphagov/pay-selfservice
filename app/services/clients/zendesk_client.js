'use strict'

// NPM dependencies
const zendesk = require('node-zendesk')

const zendeskConfig = require('../../../config/zendesk')

const zendeskClient = zendesk.createClient({
  username: 'zd-api-pay@digital.cabinet-office.gov.uk',
  token: process.env.ZENDESK_API_KEY,
  remoteUri: 'https://govuk.zendesk.com/api/v2',
  proxy: process.env.http_proxy
})

module.exports = {

  createTicket: opts => {
    return new Promise(function (resolve, reject) {
      zendeskClient.tickets.create({
        ticket: {
          requester: {
            email: opts.email,
            name: opts.name
          },
          type: opts.type,
          subject: opts.subject,
          comment: {
            body: opts.message
          },
          group_id: zendeskConfig.GROUP_ID,
          organization_id: zendeskConfig.ORG_ID,
          tags: opts.tags
        }
      }, (err, request, result) => {
        if (err) {
          reject(new Error(`argument: ${err}`))
        }
        resolve()
      })
    })
  }
}
