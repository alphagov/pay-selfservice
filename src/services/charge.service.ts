import ChargeRequest from '@models/charge/ChargeRequest.class'
import ConnectorClient from '@services/clients/pay/ConnectorClient.class'
import { ChargeRefundRequest } from '@models/charge/ChargeRefundRequest.class'

const connectorClient = new ConnectorClient()

const createCharge = (serviceExternalId: string, accountType: string, chargeRequest: ChargeRequest) =>
  connectorClient.charges.postChargeByServiceExternalIdAndAccountType(serviceExternalId, accountType, chargeRequest)

const getCharge = (serviceExternalId: string, accountType: string, chargeExternalId: string) =>
  connectorClient.charges.getChargeByServiceExternalIdAndAccountType(serviceExternalId, accountType, chargeExternalId)

const submitRefund = async (
  serviceExternalId: string,
  accountType: string,
  chargeExternalId: string,
  transactionRefundRequest: ChargeRefundRequest
) => {
  await connectorClient.charges.submitRefund(serviceExternalId, accountType, chargeExternalId, transactionRefundRequest)
}

export { createCharge, getCharge, submitRefund }
