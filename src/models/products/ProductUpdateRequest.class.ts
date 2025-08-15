import { ProductUpdateRequestData } from '@models/products/dto/ProductUpdateRequest.dto'
import Product from '@models/products/Product.class'

interface ProductAmount {
  price?: number
  hint?: string
}

interface ProductReference {
  enabled: boolean
  label?: string
  hint?: string
}

interface ProductUpdateRequestBuilderInput {
  name: string
  description?: string
  amount: ProductAmount
  reference: ProductReference
  metadata?: Record<string, string>
}

export class ProductUpdateRequestBuilder<T extends Partial<ProductUpdateRequestBuilderInput>> {
  private readonly actual: T

  private constructor(actual: T) {
    this.actual = actual
  }

  static create() {
    return new ProductUpdateRequestBuilder({})
  }

  static fromProduct(product: Product) {
    return new ProductUpdateRequestBuilder({
      name: product.name,
      description: product.description,
      amount: {
        price: product.price,
        hint: product.amountHint,
      },
      reference: {
        enabled: product.referenceEnabled,
        label: product.referenceLabel,
        hint: product.referenceHint,
      },
      metadata: product.metadata,
    })
  }

  setName(name: string) {
    return new ProductUpdateRequestBuilder({ ...this.actual, name })
  }

  setDescription(description?: string) {
    return new ProductUpdateRequestBuilder({ ...this.actual, description })
  }

  setAmount(amount: ProductAmount) {
    return new ProductUpdateRequestBuilder({ ...this.actual, amount })
  }

  setReference(reference: ProductReference) {
    return new ProductUpdateRequestBuilder({ ...this.actual, reference })
  }

  setMetadata(metadata: Record<string, string>) {
    const updatedMetadata = Object.keys(metadata).length === 0 ? null : metadata
    return new ProductUpdateRequestBuilder({ ...this.actual, metadata: updatedMetadata })
  }

  build(this: ProductUpdateRequestBuilder<ProductUpdateRequestBuilderInput>): ProductUpdateRequestData {
    const input = this.actual
    return {
      name: input.name,
      description: input.description ?? undefined,
      price: input.amount.price ?? 0,
      amount_hint: input.amount.hint ?? undefined,
      reference_enabled: input.reference.enabled,
      reference_label: input.reference.enabled ? input.reference.label : undefined,
      reference_hint: input.reference.enabled ? input.reference.hint : undefined,
      ...(input.metadata && {
        metadata: input.metadata,
      }),
    }
  }
}
