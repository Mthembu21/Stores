import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import { useMe } from '../services/auth';

function SideLink({ to, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function NavSection({ title }) {
  return (
    <div className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-white/50">
      {title}
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { data } = useMe();
  const user = data?.user || data;
  const role = user?.role;

  const canSeeTools = role === 'Admin' || role === 'ToolsStoreman';
  const canSeeSpareParts = role === 'Admin' || role === 'PartsStoreman' || role === 'Supervisor';
  const canSeeUsers = role === 'Admin' || role === 'ToolsStoreman';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden md:block md:w-72 bg-epiroc-blue min-h-screen p-4">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">Epiroc Workshop</div>
            <div className="h-2.5 w-10 rounded-full bg-epiroc-yellow" />
          </div>

          <nav className="mt-6 space-y-2">
            <SideLink to="/">Dashboard</SideLink>

            {canSeeTools && (
              <>
                <NavSection title="Tools Management" />
                <SideLink to="/tools">Tools Inventory</SideLink>
                <SideLink to="/special-tools">Special Tools</SideLink>
              </>
            )}

            {canSeeSpareParts && (
              <>
                <NavSection title="Spare Parts & Stores" />
                <SideLink to="/spare-parts">Parts Dashboard</SideLink>
                <SideLink to="/spare-parts/inventory">Parts Inventory</SideLink>
                <SideLink to="/spare-parts/issue">Issue Parts</SideLink>
                <SideLink to="/spare-parts/store-issues">Store Issues</SideLink>
                <SideLink to="/spare-parts/returns">Returns</SideLink>
                <SideLink to="/spare-parts/low-stock">Low Stock</SideLink>
                <SideLink to="/spare-parts/to-order">Parts To Order</SideLink>
                <SideLink to="/spare-parts/movements">Stock Movements</SideLink>
                <SideLink to="/spare-parts/kpi">Daily KPIs</SideLink>
              </>
            )}

            {canSeeUsers && (
              <>
                <NavSection title="Administration" />
                <SideLink to="/users">Users</SideLink>
              </>
            )}
          </nav>

          <button
            className="mt-8 w-full rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 min-h-screen">
          <header className="md:hidden bg-epiroc-blue p-4 flex items-center justify-between">
            <div className="text-white font-semibold">Epiroc Workshop</div>
            <button
              className="rounded-xl bg-epiroc-yellow px-3 py-1.5 text-sm font-semibold text-epiroc-black"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </button>
          </header>

          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
