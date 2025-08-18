export interface ProductUpdateRequestData {
  name: string
  description?: string
  price: number
  reference_enabled: boolean
  amount_hint?: string
  reference_label?: string
  reference_hint?: string
  metadata?: Record<string, string>
}
