"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRoleForUser = exports.normalizeRoleValue = void 0;
const user_entity_1 = require("../entities/user.entity");
const legacyRoleMap = {
    Ejecutor: user_entity_1.UserRole.MIEMBRO,
};
const emailRoleOverrides = {
    'tiagofur@gmail.com': user_entity_1.UserRole.ADMIN,
};
const normalizeRoleValue = (role) => {
    if (!role) {
        return user_entity_1.UserRole.GESTOR;
    }
    const legacyMatch = legacyRoleMap[role];
    if (legacyMatch) {
        return legacyMatch;
    }
    if (Object.values(user_entity_1.UserRole).includes(role)) {
        return role;
    }
    return user_entity_1.UserRole.GESTOR;
};
exports.normalizeRoleValue = normalizeRoleValue;
const resolveRoleForUser = (email, role) => {
    const normalizedRole = (0, exports.normalizeRoleValue)(role);
    const override = email ? emailRoleOverrides[email.trim().toLowerCase()] : undefined;
    return override ?? normalizedRole;
};
exports.resolveRoleForUser = resolveRoleForUser;
//# sourceMappingURL=role.helpers.js.map