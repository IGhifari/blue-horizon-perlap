import { DIVISIONS } from '../../data/initialData.js';

export const ROLES = {
  ADMIN: 'admin',
  ADMIN_DIVISI: 'admin_divisi',
  USER: 'user',
};

export const ROLE_LABELS = {
  admin: 'Admin Utama',
  admin_divisi: 'Admin Divisi',
  user: 'User Divisi',
};

export function normalizeUsername(username) {
  return String(username ?? '')
    .trim()
    .toLowerCase();
}

export function normalizeRole(role) {
  return String(role ?? '')
    .trim()
    .toLowerCase();
}

export function isSameDivisi(divA, divB) {
  const a = String(divA ?? '').trim().toLowerCase();
  const b = String(divB ?? '').trim().toLowerCase();
  return Boolean(a && b && a === b);
}

export function isValidDivision(divisi, allDivisions = DIVISIONS) {
  const clean = String(divisi ?? '').trim().toLowerCase();
  if (!clean) return false;
  return allDivisions.some((d) => d.toLowerCase() === clean);
}

export function matchCanonicalDivision(divisi, allDivisions = DIVISIONS) {
  const clean = String(divisi ?? '').trim().toLowerCase();
  return allDivisions.find((d) => d.toLowerCase() === clean) || divisi;
}

export function usernameToInternalEmail(username) {
  const clean = normalizeUsername(username);
  if (!clean) return '';
  if (clean.includes('@')) return clean;
  const sanitized = clean.replace(/[^a-z0-9._-]/g, '');
  return `${sanitized}@perlap.internal`;
}

export function isMainAdmin(profile) {
  return Boolean(profile && normalizeRole(profile.role) === ROLES.ADMIN);
}

export function isDivisionAdmin(profile) {
  return Boolean(
    profile &&
      normalizeRole(profile.role) === ROLES.ADMIN_DIVISI &&
      isValidDivision(profile.divisi)
  );
}

export function isRegularUser(profile) {
  return Boolean(
    profile &&
      normalizeRole(profile.role) === ROLES.USER &&
      isValidDivision(profile.divisi)
  );
}

export function canManageUsers(profile) {
  return isMainAdmin(profile);
}

export function canManageTimeline(profile) {
  return isMainAdmin(profile);
}

export function canViewAllDivisions(profile) {
  return isMainAdmin(profile);
}

export function canManageDivisionItems(profile) {
  return isMainAdmin(profile) || isDivisionAdmin(profile);
}

export function getAllowedDivisions(profile, allDivisions = DIVISIONS) {
  if (!profile) return [];
  if (isMainAdmin(profile)) return [...allDivisions];
  if (
    (isDivisionAdmin(profile) || isRegularUser(profile)) &&
    profile.divisi
  ) {
    // Kembalikan nilai persis dari profile.divisi agar selalu cocok dengan RLS database
    return [profile.divisi];
  }
  return [];
}

export function canReadItem(profile, item) {
  if (!profile || !item) return false;
  if (isMainAdmin(profile)) return true;
  if (isDivisionAdmin(profile) || isRegularUser(profile)) {
    return isSameDivisi(item.divisi, profile.divisi);
  }
  return false;
}

export function canCreateItem(profile, targetDivisi) {
  if (!profile || !isValidDivision(targetDivisi)) return false;
  if (isMainAdmin(profile)) return true;
  if (isDivisionAdmin(profile) || isRegularUser(profile)) {
    return isSameDivisi(targetDivisi, profile.divisi);
  }
  return false;
}

export function canEditItem(profile, existingItem, updatedFields = {}) {
  if (!profile || !existingItem) return false;
  if (isMainAdmin(profile)) {
    if (
      updatedFields.divisi &&
      !isValidDivision(updatedFields.divisi)
    ) {
      return false;
    }
    return true;
  }
  if (isDivisionAdmin(profile)) {
    const oldMatches = isSameDivisi(existingItem.divisi, profile.divisi);
    const newDivisi = updatedFields.divisi ?? existingItem.divisi;
    const newMatches = isSameDivisi(newDivisi, profile.divisi);
    return oldMatches && newMatches;
  }
  return false;
}

export function canDeleteItem(profile, existingItem) {
  if (!profile || !existingItem) return false;
  if (isMainAdmin(profile)) return true;
  if (isDivisionAdmin(profile)) {
    return isSameDivisi(existingItem.divisi, profile.divisi);
  }
  return false;
}

export function canUpdateProfileRoleOrDivisi(actorProfile) {
  return isMainAdmin(actorProfile);
}

export function resolveEffectiveDivisionForCreate(profile, requestedDivisi) {
  if (!profile) {
    throw new Error('Autentikasi diperlukan untuk mengirim pengajuan.');
  }
  if (isMainAdmin(profile)) {
    if (!isValidDivision(requestedDivisi)) {
      throw new Error('Divisi yang dipilih tidak valid.');
    }
    return requestedDivisi;
  }
  if (!isValidDivision(profile.divisi)) {
    throw new Error('Profil pengguna belum memiliki divisi yang valid.');
  }
  if (requestedDivisi && !isSameDivisi(requestedDivisi, profile.divisi)) {
    throw new Error(
      `Akses ditolak: Anda hanya dapat mengirim pengajuan untuk divisi ${profile.divisi}.`
    );
  }
  // Gunakan nilai divisi persis dari profile.divisi agar cocok 100% dengan RLS di database
  return profile.divisi;
}

export function filterItemsByProfileAccess(items, profile) {
  if (!profile || !Array.isArray(items)) return [];
  if (isMainAdmin(profile)) return items;
  if (isDivisionAdmin(profile) || isRegularUser(profile)) {
    return items.filter((item) => isSameDivisi(item.divisi, profile.divisi));
  }
  return [];
}
