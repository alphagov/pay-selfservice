'use strict'

const zendesk = require('node-zendesk')
const logger = require('../../utils/logger')(__filename)
const zendeskConfig = require('../../../config/zendesk')

const zendeskClient = zendesk.createClient({
  username: process.env.ZENDESK_USER,
  token: process.env.ZENDESK_API_KEY,
  remoteUri: process.env.ZENDESK_URL,
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
          ticket_form_id: zendeskConfig.FORM_ID,
          tags: opts.tags
        }
      }, (err, request, result) => {
        if (err) {
          logger.error(`${opts.correlationId} there was an error creating Zendesk ticket: ${err}`)
          reject(new Error(`Something went wrong, please contact support team.`))
        }
        resolve()
      })
    })
  }
}
