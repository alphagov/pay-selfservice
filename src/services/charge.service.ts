import ChargeRequest from '@models/charge/ChargeRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'

const connectorClient = new ConnectorClient()

export = {
  createCharge: (serviceExternalId: string, accountType: string, chargeRequest: ChargeRequest) =>
    connectorClient.charges.postChargeByServiceExternalIdAndAccountType(serviceExternalId, accountType, chargeRequest),
  getCharge: (serviceExternalId: string, accountType: string, chargeExternalId: string) =>
    connectorClient.charges.getChargeByServiceExternalIdAndAccountType(serviceExternalId, accountType, chargeExternalId),
}
