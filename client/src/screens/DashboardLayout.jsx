import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';

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

export default function DashboardLayout() {
  const navigate = useNavigate();

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
            <SideLink to="/tools">Tools</SideLink>
            <SideLink to="/users">Users</SideLink>
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
