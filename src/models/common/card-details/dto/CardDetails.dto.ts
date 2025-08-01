export interface CardDetailsData {
  cardholder_name: string
  billing_address: {
    line1: string
    line2?: string
    postcode: string
    city: string
    country: string
  }
  card_brand: string
  last_digits_card_number: string
  first_digits_card_number: string
  expiry_date: string
  card_type: string
}
