export const EventType = {
  PAYMENT_CREATED: 'PAYMENT_CREATED' as EventType,
  PAYMENT_STARTED: 'PAYMENT_STARTED' as EventType,
  AUTHORISATION_SUCCEEDED: 'AUTHORISATION_SUCCEEDED' as EventType,
  USER_APPROVED_FOR_CAPTURE: 'USER_APPROVED_FOR_CAPTURE' as EventType,
  REFUND_CREATED_BY_USER: 'REFUND_CREATED_BY_USER' as EventType,
  REFUND_SUCCEEDED: 'REFUND_SUCCEEDED' as EventType,
}

export type EventType =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_STARTED'
  | 'AUTHORISATION_SUCCEEDED'
  | 'USER_APPROVED_FOR_CAPTURE'
  | 'REFUND_CREATED_BY_USER'
  | 'REFUND_SUCCEEDED'

export const EventTypeFriendlyNames: Record<EventType, string> = {
  PAYMENT_CREATED: 'Payment created',
  PAYMENT_STARTED: 'Payment started',
  AUTHORISATION_SUCCEEDED: 'Authorisation succeeded',
  USER_APPROVED_FOR_CAPTURE: 'User approved for capture',
  REFUND_CREATED_BY_USER: 'Refund created by user',
  REFUND_SUCCEEDED: 'Refund succeeded',
}
