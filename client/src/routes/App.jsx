import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../screens/LoginPage';
import DashboardLayout from '../screens/DashboardLayout';
import UsersPage from '../screens/UsersPage';
import ToolsPage from '../screens/ToolsPage';
import SpecialToolsPage from '../screens/SpecialToolsPage';
import PartsDashboardPage from '../screens/PartsDashboardPage';
import PartsInventoryPage from '../screens/PartsInventoryPage';
import IssuePartsPage from '../screens/IssuePartsPage';
import StoreIssuesPage from '../screens/StoreIssuesPage';
import PartReturnsPage from '../screens/PartReturnsPage';
import LowStockPage from '../screens/LowStockPage';
import PartsToOrderPage from '../screens/PartsToOrderPage';
import StockMovementsPage from '../screens/StockMovementsPage';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';
import HomeRedirect from './HomeRedirect';
import { MODULE_ROLES } from '../config/permissions';

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
        <Route index element={<HomeRedirect />} />
        <Route
          path="users"
          element={
            <RequireRole roles={MODULE_ROLES.admin}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="tools"
          element={
            <RequireRole roles={MODULE_ROLES.tools}>
              <ToolsPage />
            </RequireRole>
          }
        />
        <Route
          path="special-tools"
          element={
            <RequireRole roles={MODULE_ROLES.tools}>
              <SpecialToolsPage />
            </RequireRole>
          }
        />

        <Route
          path="spare-parts"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <PartsDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/inventory"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <PartsInventoryPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/issue"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <IssuePartsPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/store-issues"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <StoreIssuesPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/returns"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <PartReturnsPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/low-stock"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <LowStockPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/to-order"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <PartsToOrderPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/movements"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts}>
              <StockMovementsPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
