import {Link} from "./link";
import {ServiceRole} from "./service-role";
import {Role} from "./role";

export class User {
    disabled?: boolean;
    email?: string;
    externalId?: string;
    lastLoggedInAt?: number;
    links?: Link[];
    loginCounter?: number;
    otpKey?: string;
    provisionalOtpKey?: string;
    provisionalOtpKeyCreatedAt?: string;
    secondFactor?: UserSecondFactorEnum;
    serviceRoles?: ServiceRole[];
    sessionVersion?: number;
    telephoneNumber?: string;
    username?: string;

    hasPermission(serviceExternalId: string, permissionName: string) {
        const roleForService = this.getRoleForService(serviceExternalId)
        return roleForService && roleForService.permissions
            .map(permission => permission.name)
            .includes(permissionName)
    }

    getRoleForService(externalServiceId: string): Role {
        const serviceRole = this.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId)
        return serviceRole.role
    }

    public hasService(externalServiceId: string): boolean {
        return this.serviceRoles.map(serviceRole => serviceRole.service.externalId).includes(externalServiceId)
    }

    getPermissionsForService(serviceExternalId: string): string[] {
        const roleForService = this.getRoleForService(serviceExternalId)

        if (roleForService) {
            return roleForService.permissions.map(permission => permission.name)
        }
    }

    isAdminUserForService(serviceExternalId: string) {
        return this.serviceRoles
            .filter(serviceRole => serviceRole.role && serviceRole.role.name === 'admin' &&
                serviceRole.service && serviceRole.service.externalId === serviceExternalId)
            .length > 0
    }
}

export enum UserSecondFactorEnum {
    Sms = 'sms',
    App = 'app'
}

