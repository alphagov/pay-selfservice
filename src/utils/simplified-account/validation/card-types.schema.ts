import { body } from 'express-validator'

const sanitiseToArray = (value: string): string[] => (Array.isArray(value) ? value : value ? [value] : [])

interface CardTypesValidationBody {
  debit: string
  credit: string
}

const cardTypesSchema = {
  validate: body()
    .custom((_, { req }) => {
      const _req = req as { body: CardTypesValidationBody }

      const selectedCardTypeIds = sanitiseToArray(_req.body.debit).concat(sanitiseToArray(_req.body.credit))
      return selectedCardTypeIds.length >= 1
    })
    .withMessage('You must choose at least one card'),
}

export { cardTypesSchema, sanitiseToArray }
