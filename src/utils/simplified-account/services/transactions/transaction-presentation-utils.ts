import { Transaction } from '@models/ledger/Transaction.class'
import { Event } from '@models/ledger/Event.class'
import Service from '@models/service/Service.class'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import _ from 'lodash'
import changeCase from 'change-case'
import { EventType } from '@models/ledger/types/event-type'
import { ResourceType } from '@models/ledger/types/resource-type'

const DATESTAMP_FORMAT = 'dd LLL yyyy — HH:mm:ss'

const transactionDetails = (transaction: Transaction, service: Service) => {
  const details = {
    'Reference number': transaction.reference,
    'Service name': service.serviceName.en,
    Description: transaction.description,
    'Date created': transaction.createdDate.toFormat(DATESTAMP_FORMAT),
    'Payment status': friendlyStatus(transaction.state),
    ...(transaction.authorisationSummary && {
      '3D Secure (3DS)': transaction.authorisationSummary.threeDSecure.required ? 'Required' : 'Not required',
    }),
  }

  const amount = {
    'Payment amount': penceToPoundsWithCurrency(transaction.amount),
    ...(transaction.refundSummary.amountRefunded > 0 && {
      'Refunded amount': `–${penceToPoundsWithCurrency(transaction.refundSummary.amountRefunded)}`,
    }),
  }

  const method = {
    ...(transaction.cardDetails
      ? {
          'Payment type': transaction.walletType ? changeCase.titleCase(transaction.walletType) : 'Card',
          'Card brand': transaction.cardDetails.cardBrand,
          'Name on card': transaction.cardDetails.cardholderName,
          'Card number': `•••• ${transaction.cardDetails.lastDigitsCardNumber}`,
          'Card expiry date': transaction.cardDetails.expiryDate,
        }
      : {}),
    Email: transaction.email,
  }

  const provider = {
    Provider: changeCase.upperCaseFirst(transaction.paymentProvider),
    'Provider ID': transaction.gatewayTransactionId,
    'GOV.UK Pay ID': transaction.externalId,
  }

  const view = {
    'Transaction Details': details,
    Amount: amount,
    'Payment method': method,
    'Payment provider': provider,
  }

  return _.omitBy(view, (value) => {
    return _.isPlainObject(value) && _.isEmpty(_.omitBy(value, (v) => v === null || v === undefined))
  })
}

const friendlyStatus = (state: { finished: boolean; status: string }) => {
  return state.status
}

const eventDetails = (events: Event[]) => {
  return events.reduce<
    Record<number, { description: string; formattedAmount: string; timestamp: string; metadata?: string }>
  >((acc, event, index) => {
    acc[index] = {
      description: event.friendlyEventType,
      formattedAmount: `${event.resourceType === ResourceType.REFUND ? '–' : ''}${penceToPoundsWithCurrency(event.amount)}`,
      timestamp: event.timestamp.toFormat(DATESTAMP_FORMAT),
      ...(event.eventType === EventType.REFUND_CREATED_BY_USER && {
        metadata: `submitted by ${event.metadata?.user_email as string}`,
      }),
    }
    return acc
  }, {})
}

export { transactionDetails, eventDetails }
