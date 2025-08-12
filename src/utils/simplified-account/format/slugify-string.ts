// @ts-expect-error: Missing type definitions for @govuk-pay/pay-js-commons module
import { nunjucksFilters } from '@govuk-pay/pay-js-commons'

const { slugify, removeIndefiniteArticles } = (
  nunjucksFilters as {
    slugify: (input: string) => string
    removeIndefiniteArticles: (input: string) => string
  }
)

export = (input: string) => {
  return slugify(removeIndefiniteArticles(input))
}
