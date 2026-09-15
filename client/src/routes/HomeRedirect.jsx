import { Navigate } from 'react-router-dom';
import { useMe } from '../services/auth';
import { MODULE_ROLES } from '../config/permissions';
import { PARTS_PAGES, hasPartsPageAccess } from '../config/partsPages';
import DashboardHome from '../screens/DashboardHome';

export default function HomeRedirect() {
  const { data, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-epiroc-gray font-semibold">Loading…</div>
      </div>
    );
  }

  const user = data?.user || data;

  if (user && !MODULE_ROLES.tools.includes(user.role) && MODULE_ROLES.spareParts.includes(user.role)) {
    // A Storeman restricted to specific pages might not have access to the
    // Parts Dashboard itself — send them to the first page they can open.
    const firstAllowedPage = PARTS_PAGES.find((p) => hasPartsPageAccess(user, p.key));
    if (firstAllowedPage) {
      return <Navigate to={`/${firstAllowedPage.key}`} replace />;
    }
    return <DashboardHome />;
  }

  return <DashboardHome />;
}
