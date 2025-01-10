'use strict'

const ConnectorClient = require('./clients/connector.client.js').ConnectorClient
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

async function getAllCardTypes () {
  return connectorClient.getAllCardTypes()
}

async function getAcceptedCardTypesForServiceAndAccountType (serviceId, accountType) {
  return connectorClient.getAcceptedCardsForServiceAndAccountType(serviceId, accountType)
}

async function postAcceptedCardsForServiceAndAccountType (serviceId, accountType, payload) {
  return connectorClient.postAcceptedCardsForServiceAndAccountType(serviceId, accountType, payload)
}

module.exports = {
  getAllCardTypes,
  getAcceptedCardTypesForServiceAndAccountType,
  postAcceptedCardsForServiceAndAccountType
}
