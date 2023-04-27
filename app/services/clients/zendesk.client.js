'use strict'

const axios = require('axios')
const zendeskConfig = require('../../../config/zendesk')
const urlJoin = require('url-join')

function createTicket (opts) {
  const zendeskTicketData = {
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
  }

  return axios({
    method: 'post',
    url: urlJoin(process.env.ZENDESK_URL, '/tickets'),
    data: zendeskTicketData,
    auth: {
      username: process.env.ZENDESK_USER + '/token',
      password: process.env.ZENDESK_API_KEY
    }
  })
}

module.exports = {
  createTicket
}
