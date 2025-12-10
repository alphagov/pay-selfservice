import {
  DisputeStatusFriendlyNames,
  PaymentStatusFriendlyNames,
  RefundStatusFriendlyNames,
  Status,
} from '@models/ledger/types/status'
import { ConnectorStates } from '@models/ledger/types/status'
import lodash from 'lodash'

export function displayStatesToConnectorStates(displayStates: string | string[]): ConnectorStates {
  const selected = Array.isArray(displayStates) ? displayStates : [displayStates]
  return toConnectorStates(selected)
}

function toConnectorStates(selectedStateStrings: string[]): ConnectorStates {
  const payment = populatePaymentStates(selectedStateStrings, PaymentStatusFriendlyNames)
  const refund = populatePaymentStates(selectedStateStrings, RefundStatusFriendlyNames)
  const dispute = populatePaymentStates(selectedStateStrings, DisputeStatusFriendlyNames)

  const result: ConnectorStates = {
    paymentStates: !lodash.isEmpty(payment) ? payment : undefined,
    refundStates: !lodash.isEmpty(refund) ? refund : undefined,
    disputeStates: !lodash.isEmpty(dispute) ? dispute : undefined,
  }
  return result
}

function populatePaymentStates(
  selectedStateStrings: string[],
  friendlyNamesMap: Partial<Record<Status, string>>
): string[] {
  const result: string[] = []
  Object.keys(friendlyNamesMap).forEach((status) => {
    selectedStateStrings.forEach((selectedStatus) => {
      if (friendlyNamesMap[status as Status] === selectedStatus) {
        result.push(status.toLowerCase())
      }
    })
  })
  return result
}
