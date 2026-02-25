import { Permission, Role } from '@models/service/dto/ServiceRole.dto'
import Roles from '@test/fixtures/roles.fixtures'

export class RoleFixture {
  readonly name: string
  readonly description: string
  readonly permissions: Permission[]

  constructor(overrides?: Partial<RoleFixture>) {
    this.name = 'admin'
    this.description = 'Administrator role'
    this.permissions = Roles.admin.permissions

    if (overrides) {
      Object.assign(this, overrides)
    }
  }

  toRoleData(): Role {
    return {
      name: this.name,
      description: this.description,
      permissions: this.permissions,
    }
  }

  toRole(): Role {
    return this.toRoleData()
  }

  static Admin() {
    return new RoleFixture(Roles.admin)
  }

  static ViewOnly() {
    return new RoleFixture(Roles['view-only'])
  }

  static ViewAndRefund() {
    return new RoleFixture(Roles['view-and-refund'])
  }

  static ViewAndInitiateMoto() {
    return new RoleFixture(Roles['view-and-initiate-moto'])
  }

  static ViewAndRefundInitiateMoto() {
    return new RoleFixture(Roles['view-refund-and-initiate-moto'])
  }
}
