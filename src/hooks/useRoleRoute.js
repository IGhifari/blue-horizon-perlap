import { useState, useEffect } from 'react';

export function detectRoleFromLocation(loc = window.location) {
  const pathname = (loc.pathname || '').toLowerCase();
  const hash = (loc.hash || '').toLowerCase();
  const params = new URLSearchParams(loc.search || '');
  const roleParam = (params.get('role') || params.get('mode') || '').toLowerCase();

  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    hash === '#/admin' ||
    hash.startsWith('#/admin/') ||
    roleParam === 'admin'
  ) {
    return 'admin';
  }
  return 'user';
}

export function useRoleRoute() {
  const [role, setRole] = useState(() => detectRoleFromLocation());

  useEffect(() => {
    const syncRole = () => {
      setRole(detectRoleFromLocation());
    };

    window.addEventListener('popstate', syncRole);
    window.addEventListener('hashchange', syncRole);
    return () => {
      window.removeEventListener('popstate', syncRole);
      window.removeEventListener('hashchange', syncRole);
    };
  }, []);

  return {
    role,
    isAdmin: role === 'admin',
  };
}
