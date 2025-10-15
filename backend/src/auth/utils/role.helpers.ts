import { UserRole } from '../entities/user.entity';

const legacyRoleMap: Record<string, UserRole> = {
    Ejecutor: UserRole.MIEMBRO,
};

const emailRoleOverrides: Record<string, UserRole> = {
    'tiagofur@gmail.com': UserRole.ADMIN,
};

export const normalizeRoleValue = (role?: string | null): UserRole => {
    if (!role) {
        return UserRole.GESTOR;
    }

    const legacyMatch = legacyRoleMap[role];
    if (legacyMatch) {
        return legacyMatch;
    }

    if ((Object.values(UserRole) as string[]).includes(role as UserRole)) {
        return role as UserRole;
    }

    return UserRole.GESTOR;
};

export const resolveRoleForUser = (email: string, role?: string | null): UserRole => {
    const normalizedRole = normalizeRoleValue(role);
    const override = email ? emailRoleOverrides[email.trim().toLowerCase()] : undefined;
    return override ?? normalizedRole;
};
