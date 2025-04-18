import Service from '@models/Service.class'
import { ServiceRoleData, Role } from '@models/service/dto/ServiceRole.dto'

class ServiceRole {
  readonly service: Service
  readonly role: Role

  constructor(serviceRoleData: ServiceRoleData) {
    this.service = new Service(serviceRoleData.service)
    this.role = serviceRoleData.role
  }
}

export = ServiceRole
