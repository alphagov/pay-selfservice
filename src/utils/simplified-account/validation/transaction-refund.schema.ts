import { body } from 'express-validator'
import { ServiceRequest } from '@utils/types/express'
import { Transaction } from '@models/ledger/Transaction.class'

interface RefundRequestBody {
  refundPayment: string
  partialRefundAmount: string
}

const transactionRefundSchema = {
  refundPayment: {
    validate: body('refundPayment').isIn(['full', 'partial']).withMessage('Select an option'),
  },
  partialRefundAmount: {
    validateForTransaction: (transaction: Transaction) =>
      body('partialRefundAmount')
        .if((value: string, { req }: { req: unknown }) => {
          const _req = req as ServiceRequest<RefundRequestBody>
          return _req.body.refundPayment === 'partial'
        })
        .trim()
        .notEmpty()
        .withMessage('Enter a refund amount')
        .bail()
        .isNumeric()
        .withMessage(
          'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”'
        )
        .bail()
        .isFloat({ min: 0, max: transaction.getRefundableAmountRemaining() / 100 })
        .withMessage(
          `Enter a refund amount greater than £0.00 and less than ${transaction.refundableAmountRemainingInPounds()}`
        )
        .bail()
        .custom((value: string) => {
          // two decimal places
          return /^\d+(\.\d{2})?$/.test(value)
        })
        .withMessage(
          'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”'
        ),
  },
}

export { transactionRefundSchema }
