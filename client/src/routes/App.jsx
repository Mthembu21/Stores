import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../screens/LoginPage';
import DashboardLayout from '../screens/DashboardLayout';
import DashboardHome from '../screens/DashboardHome';
import UsersPage from '../screens/UsersPage';
import ToolsPage from '../screens/ToolsPage';
import SpecialToolsPage from '../screens/SpecialToolsPage';
import { RequireAuth } from './RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="special-tools" element={<SpecialToolsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
