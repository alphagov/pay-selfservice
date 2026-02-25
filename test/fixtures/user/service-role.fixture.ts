import { ServiceRoleData } from '@models/service/dto/ServiceRole.dto'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import { RoleFixture } from '@test/fixtures/service/role.fixture'

export class ServiceRoleFixture {
  readonly service: ServiceFixture
  readonly role: RoleFixture

  constructor(overrides?: Partial<ServiceRoleFixture>) {
    this.service = new ServiceFixture()
    this.role = RoleFixture.Admin()

    if (overrides) {
      Object.assign(this, overrides)
    }
  }

  toServiceRoleData(): ServiceRoleData {
    return {
      service: this.service.toServiceData(),
      role: this.role.toRoleData(),
    }
  }
}
