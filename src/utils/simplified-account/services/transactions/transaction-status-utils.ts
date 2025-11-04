import { PaymentStatusFriendlyNames, RefundStatusFriendlyNames, Status } from '@models/ledger/types/status'
import { ConnectorStates } from '@models/ledger/types/status'

export function displayStatesToConnectorStates(displayStates: string | string[]): ConnectorStates {
  const selected = Array.isArray(displayStates)
    ? displayStates
    : [displayStates]
  return toConnectorStates(selected)
}

function toConnectorStates(selectedStateStrings: string[]): ConnectorStates {
  const result: ConnectorStates = {
    paymentStates: [],
    refundStates: [],
    disputeStates: []
  }

  populatePaymentStates(selectedStateStrings, result)
  populateRefundStates(selectedStateStrings, result)

  return result
}

function populatePaymentStates(selectedStateStrings: string[], result: ConnectorStates) {
  Object.keys(PaymentStatusFriendlyNames).forEach(status => {
    selectedStateStrings.forEach(selectedStatus => {
      if (PaymentStatusFriendlyNames[status as Status] === selectedStatus) {
        result.paymentStates.push(status.toLowerCase())
      }
    })
  })
}

function populateRefundStates(selectedStateStrings: string[], result: ConnectorStates) {
  Object.keys(RefundStatusFriendlyNames).forEach(status => {
    selectedStateStrings.forEach(selectedStatus => {
      if (RefundStatusFriendlyNames[status as Status] === selectedStatus) {
        result.refundStates.push(status.toLowerCase())
      }
    })
  })
}

