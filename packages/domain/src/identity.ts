export const roles = ["owner", "admin", "manager", "warehouse", "finance", "viewer"] as const;
export type Role = (typeof roles)[number];
export type Permission = "crm:read" | "settings:read";

export const roleLabels: Record<Role, string> = {
  owner: "Власник", admin: "Адміністратор", manager: "Менеджер",
  warehouse: "Комірник", finance: "Фінансист", viewer: "Перегляд",
};

export function can(role: Role, permission: Permission): boolean {
  if (!roles.includes(role)) return false;
  return permission === "crm:read" || (permission === "settings:read" && (role === "owner" || role === "admin"));
}
