import { AnyJson } from '@pact-foundation/pact/src/common/jsonTypes'

type AssignServiceRoleRequest = AnyJson & {
  service_external_id: string
  role_name: string
}

export class AssignServiceRoleRequestFixture {
  readonly serviceExternalId: string
  readonly roleName: string

  constructor(overrides?: Partial<AssignServiceRoleRequestFixture>) {
    this.serviceExternalId = overrides?.serviceExternalId ?? '9en17v'
    this.roleName = overrides?.roleName ?? 'admin'
  }

  toRequest(): AssignServiceRoleRequest {
    return {
      service_external_id: this.serviceExternalId,
      role_name: this.roleName,
    }
  }
}
