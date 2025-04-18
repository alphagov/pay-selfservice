import { ServiceRoleData } from '@models/service/dto/ServiceRole.dto'

interface UserData {
  external_id: string
  email?: string
  service_roles: ServiceRoleData[]
  otp_key?: string
  telephone_number?: string
  disabled?: boolean
  session_version?: number
  features?: string
  second_factor: string
  provisional_otp_key?: string

}

export = UserData
