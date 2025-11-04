import { PaymentStatusFriendlyNames, Status } from '@models/ledger/types/status'

export function displayStatesToConnectorStates(displayStates: string | string[]): string[] {
  const selected = Array.isArray(displayStates)
    ? displayStates
    : [displayStates]
  return toConnectorStates(selected)
}

function toConnectorStates(selectedStateStrings: string[]): string[] {
  const paymentStates: string[] = []

  Object.keys(PaymentStatusFriendlyNames).forEach(status => {

    selectedStateStrings.forEach(selectedStatus => {
      if (PaymentStatusFriendlyNames[status as Status] === selectedStatus) {
        paymentStates.push(status.toLowerCase())
      }
    })
  })

  return paymentStates
}
