import { Transaction } from '@models/ledger/Transaction.class'
import { Event } from '@models/ledger/Event.class'
import Service from '@models/service/Service.class'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import _ from 'lodash'
import changeCase from 'change-case'
import { EventType } from '@models/ledger/types/event-type'
import { ResourceType } from '@models/ledger/types/resource-type'
import { Status } from '@models/ledger/types/status'

const DATESTAMP_FORMAT = 'dd LLL yyyy — HH:mm:ss'

const transactionDetails = (
  { transaction, dispute }: { transaction: Transaction; dispute?: Transaction },
  service: Service
) => {
  const view = {
    'Transaction Details': {
      'Reference number': transaction.reference,
      'Service name': service.serviceName.en,
      Description: transaction.description,
      'Date created': transaction.createdDate.toFormat(DATESTAMP_FORMAT),
      'Payment status': transaction.friendlyTransactionStatus,
      ...(transaction.authorisationSummary && {
        '3D Secure (3DS)': transaction.authorisationSummary.threeDSecure.required ? 'Required' : 'Not required',
      }),
    },
    Amount: {
      'Payment amount':
        transaction.totalAmount && transaction.corporateCardSurcharge
          ? `${penceToPoundsWithCurrency(transaction.totalAmount)} (including card fee of ${penceToPoundsWithCurrency(transaction.corporateCardSurcharge)})`
          : penceToPoundsWithCurrency(transaction.amount),
      ...(transaction.fee && {
        'Provider fee': penceToPoundsWithCurrency(transaction.fee),
      }),
      ...(transaction.netAmount && {
        'Net amount': penceToPoundsWithCurrency(transaction.netAmount),
      }),
      ...(transaction.refundSummary &&
        transaction.refundSummary.amountRefunded > 0 && {
          'Refunded amount': `–${penceToPoundsWithCurrency(transaction.refundSummary.amountRefunded)}`,
        }),
    },
    'Payment method': {
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
    },
    'Payment provider': {
      Provider: changeCase.upperCaseFirst(transaction.paymentProvider),
      'Provider ID': transaction.gatewayTransactionId,
      'GOV.UK Pay ID': transaction.externalId,
    },
    'Dispute details': {
      ...(dispute && {
        Status: dispute.friendlyTransactionStatus,
        'Date disputed': dispute.createdDate.toFormat(DATESTAMP_FORMAT),
        'Disputed amount': penceToPoundsWithCurrency(dispute.amount),
        ...(dispute.fee && {
          'Provider dispute fee': {
            html: `${penceToPoundsWithCurrency(dispute.fee)}
          <details class="govuk-details small-arrow govuk-!-font-size-16">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                What is this fee?
              </span>
            </summary>
            <div class="govuk-details__text">
              If you lose a payment dispute, Stripe will deduct the disputed amount and an additional £20.00 dispute fee from your account.
            </div>
          </details>`,
          },
        }),
        ...(dispute.netAmount && {
          'Dispute net amount': penceToPoundsWithCurrency(dispute.netAmount),
        }),
        Reason: dispute.friendlyReason,
        ...(dispute.evidenceDueDate && {
          'Evidence due by': dispute.evidenceDueDate.toFormat(DATESTAMP_FORMAT),
        }),
      }),
    },
  }

  return _.omitBy(view, (value) => {
    return _.isPlainObject(value) && _.isEmpty(_.omitBy(value, (v) => v === null || v === undefined))
  })
}

const eventDetails = ({ events }: { events: Event[] }) => {
  return events
    .reverse()
    .reduce<
      Record<number, { description: string; formattedAmount: string; timestamp: string; metadata?: string }>
    >((acc, event, index) => {
      acc[index] = {
        description: event.friendlyEventType,
        formattedAmount: `${event.resourceType === ResourceType.REFUND ? '–' : ''}${penceToPoundsWithCurrency(event.amount)}`,
        timestamp: event.timestamp.toFormat(DATESTAMP_FORMAT),
        ...(event.eventType === EventType.REFUND_CREATED_BY_USER && {
          metadata: `Submitted by: ${event.metadata?.user_email as string}`,
        }),
        ...(eventStatusHasCode(event.state.status) && {
          metadata: `${event.state.code}: ${event.state.message}`,
        }),
      }
      return acc
    }, {})
}

const eventStatusHasCode = (eventStatus: Status): boolean => {
  return eventStatus === Status.CANCELLED || eventStatus === Status.DECLINED || eventStatus === Status.ERROR
}

export { transactionDetails, eventDetails }
