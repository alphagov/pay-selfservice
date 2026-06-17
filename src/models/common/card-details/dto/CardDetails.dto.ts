export interface CardDetailsData {
  // it is unclear whether these fields are always present
  // but it is safest to assume not
  card_brand?: string
  last_digits_card_number?: string
  expiry_date?: string
  card_type?: string

  // these fields are definitely optional
  // they may be present for some transactions, but not all
  cardholder_name?: string
  billing_address?: {
    line1: string
    line2?: string
    postcode: string
    city: string
    country: string
  }
  first_digits_card_number?: string
}
