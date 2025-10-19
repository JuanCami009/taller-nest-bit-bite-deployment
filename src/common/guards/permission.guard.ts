import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../../auth/entities/user.entity';

interface AuthenticatedRequest extends Request {
    user?: User;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.get<string[]>(
            'permissions',
            context.getHandler(),
        );
        if (!required || required.length === 0) return true;
        const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const user = req.user as User;
        if (!user) throw new ForbiddenException('No authenticated user');

        const userPerms = user.role.permissions.map(
            (rp) => rp.name,
        );
        const hasEnoughPermissions = required.every((p: string) =>
            userPerms.includes(p),
        );
        if (!hasEnoughPermissions)
            throw new ForbiddenException('Insufficient permissions');
        return true;
    }
}
