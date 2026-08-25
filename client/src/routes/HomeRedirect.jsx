import { Navigate } from 'react-router-dom';
import { useMe } from '../services/auth';
import { MODULE_ROLES } from '../config/permissions';
import DashboardHome from '../screens/DashboardHome';

export default function HomeRedirect() {
  const { data, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-epiroc-blue font-semibold">Loading…</div>
      </div>
    );
  }

  const user = data?.user || data;

  if (user && !MODULE_ROLES.tools.includes(user.role) && MODULE_ROLES.spareParts.includes(user.role)) {
    return <Navigate to="/spare-parts" replace />;
  }

  return <DashboardHome />;
}
