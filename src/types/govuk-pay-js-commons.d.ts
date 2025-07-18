declare module '@govuk-pay/pay-js-commons' {
  export interface NunjucksFilters {
    slugify: (str: string) => string;
    removeIndefiniteArticles: (str: string) => string;
  }

  export const nunjucksFilters: NunjucksFilters;
}
