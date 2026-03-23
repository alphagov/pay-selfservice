import Service from '@models/service/Service.class'
import { ServiceRoleData, Role } from '@models/service/dto/ServiceRole.dto'

class ServiceRole {
  readonly service: Service
  readonly role: Role

  constructor(serviceRoleData: ServiceRoleData) {
    this.service = new Service(serviceRoleData.service)
    this.role = serviceRoleData.role
  }

  hasPermission(permissionName: string): boolean {
    return this.role.permissions.some((permission) => permission.name === permissionName)
  }
}

export = ServiceRole
