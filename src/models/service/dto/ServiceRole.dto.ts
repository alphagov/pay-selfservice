import ServiceData from '@models/service/dto/Service.dto'

interface Permission {
  name: string
  description: string
}

interface Role {
  name: string
  description: string
  permissions: Permission[]
}

interface ServiceRoleData {
  service: ServiceData
  role: Role
}

export { ServiceRoleData, Role, Permission }
