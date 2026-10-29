import { CLIENT_GROUPS, STAFF_GROUPS, type NavGroup } from "@/modules/navigation/catalog";

export const PATHS = {
  home: "/",
  dashboard: "/dashboard",
  profile: {
    root: "/perfil",
    ficha: "/perfil",
    seguridad: "/perfil/seguridad",
  },
} as const;

export type ProfileViewId = "ficha" | "seguridad";

export function groupsForKind(kind: "empresa" | "dni"): NavGroup[] {
  return kind === "empresa" ? STAFF_GROUPS : CLIENT_GROUPS;
}

export function modulePath(groupId: string, moduleId: string) {
  return `/${groupId}/${moduleId}`;
}

export function findGroupByModuleId(groups: NavGroup[], moduleId: string) {
  return groups.find((group) => group.items.some((item) => item.id === moduleId)) ?? null;
}

export function findNavItem(groups: NavGroup[], moduleId: string) {
  for (const group of groups) {
    const item = group.items.find((entry) => entry.id === moduleId);
    if (item) return { group, item };
  }
  return null;
}

export function isKnownGroup(groups: NavGroup[], groupId: string) {
  return groups.some((group) => group.id === groupId);
}

export function resolveLocation(
  pathname: string,
  groups: NavGroup[],
): {
  kind: "dashboard" | "profile" | "module" | "unknown";
  groupId: string | null;
  moduleId: string | null;
  profileView: ProfileViewId | null;
  section: string;
  current: string;
} {
  const clean = pathname.replace(/\/+$/, "") || "/";

  if (clean === PATHS.dashboard) {
    return {
      kind: "dashboard",
      groupId: null,
      moduleId: null,
      profileView: null,
      section: "FinanTech",
      current: "Resumen",
    };
  }

  if (clean === PATHS.profile.ficha) {
    return {
      kind: "profile",
      groupId: null,
      moduleId: null,
      profileView: "ficha",
      section: "Cuenta",
      current: "Perfil",
    };
  }

  if (clean === PATHS.profile.seguridad) {
    return {
      kind: "profile",
      groupId: null,
      moduleId: null,
      profileView: "seguridad",
      section: "Cuenta",
      current: "Seguridad",
    };
  }

  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 2) {
    const [groupId, moduleId] = parts;
    const match = findNavItem(groups, moduleId);
    if (match && match.group.id === groupId) {
      return {
        kind: "module",
        groupId,
        moduleId,
        profileView: null,
        section: match.group.label.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
        current: match.item.label,
      };
    }
  }

  return {
    kind: "unknown",
    groupId: null,
    moduleId: null,
    profileView: null,
    section: "FinanTech",
    current: "Resumen",
  };
}
