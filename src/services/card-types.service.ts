import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { UpdateAcceptedCardTypesRequest } from '@models/card-type/UpdateAcceptedCardTypesRequest.class'

const connectorClient = new ConnectorClient()

async function getAllCardTypes() {
  return connectorClient.cardTypes.getAll()
}

async function getAcceptedCardTypes(serviceExternalId: string, accountType: string) {
  return connectorClient.cardTypes.getAcceptedCardTypesByServiceAndAccountType(serviceExternalId, accountType)
}

async function updateAcceptedCardTypes(
  serviceExternalId: string,
  accountType: string,
  updateCardTypesRequest: UpdateAcceptedCardTypesRequest
) {
  return connectorClient.cardTypes.updateAcceptedCardsForServiceAndAccountType(
    serviceExternalId,
    accountType,
    updateCardTypesRequest
  )
}

export { getAllCardTypes, getAcceptedCardTypes, updateAcceptedCardTypes }
