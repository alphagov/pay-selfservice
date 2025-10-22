// @ts-expect-error: Missing type definitions for @govuk-pay/pay-js-commons module
import { nunjucksFilters } from '@govuk-pay/pay-js-commons'

const { slugify, removeIndefiniteArticles } = nunjucksFilters as {
  slugify: (input: string) => string
  removeIndefiniteArticles: (input: string) => string
}

export type SlugifiedString = string & { __brand: 'Slugified string safe to use in URL paths' }

const slugifyString = (input: string): SlugifiedString => {
  return slugify(removeIndefiniteArticles(input)) as SlugifiedString
}

export { slugifyString }
