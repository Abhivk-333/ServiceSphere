/*  Service Sphere — Auth Guard v2
    Include AFTER data.js on every protected page.
    Supports roles: 'customer' | 'provider' | 'admin'
*/

const AuthGuard = (() => {
  const ROLE_REDIRECTS = {
    customer: 'customer-auth.html',
    provider: 'provider-login.html',
    admin:    'admin/login.html'
  };

  const DASHBOARD_MAP = {
    customer: 'dashboard-customer.html',
    provider: 'dashboard-provider.html',
    admin:    'admin/verify-providers.html'
  };

  function require(expectedRole) {
    const user = SS.getUser();

    // Not logged in → send to role-specific auth page
    if (!user || !user.phone) {
      window.location.href = ROLE_REDIRECTS[expectedRole] || 'customer-auth.html';
      return false;
    }

    // Wrong role → redirect to the correct dashboard (no cross-role access)
    if (expectedRole && user.role !== expectedRole) {
      window.location.href = DASHBOARD_MAP[user.role] || 'index.html';
      return false;
    }

    // Sync role key for any legacy page that reads localStorage.role
    localStorage.setItem('role', user.role);
    return true;
  }

  // Check if currently logged in user IS a specific role (non-redirecting)
  function is(role) {
    const user = SS.getUser();
    return !!(user && user.role === role);
  }

  return { require, is };
})();
