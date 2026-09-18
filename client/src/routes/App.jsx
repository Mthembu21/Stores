import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../screens/LoginPage';
import DashboardLayout from '../screens/DashboardLayout';
import UsersPage from '../screens/UsersPage';
import ToolsPage from '../screens/ToolsPage';
import SpecialToolsPage from '../screens/SpecialToolsPage';
import ConsumablesPage from '../screens/ConsumablesPage';
import PartsDashboardPage from '../screens/PartsDashboardPage';
import PartsInventoryPage from '../screens/PartsInventoryPage';
import IssuePartsPage from '../screens/IssuePartsPage';
import IssueConsumablesPage from '../screens/IssueConsumablesPage';
import StoreIssuesPage from '../screens/StoreIssuesPage';
import PartReturnsPage from '../screens/PartReturnsPage';
import LowStockPage from '../screens/LowStockPage';
import PartsToOrderPage from '../screens/PartsToOrderPage';
import NonStockItemsPage from '../screens/NonStockItemsPage';
import StockMovementsPage from '../screens/StockMovementsPage';
import KpiTrackerPage from '../screens/KpiTrackerPage';
import PartsUsersPage from '../screens/PartsUsersPage';
import IssuePrintPage from '../screens/IssuePrintPage';
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
          path="consumables"
          element={
            <RequireRole roles={MODULE_ROLES.tools}>
              <ConsumablesPage />
            </RequireRole>
          }
        />

        <Route
          path="spare-parts"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts">
              <PartsDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/inventory"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/inventory">
              <PartsInventoryPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/issue"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/issue">
              <IssuePartsPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/issue-consumables"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/issue-consumables">
              <IssueConsumablesPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/store-issues"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/store-issues">
              <StoreIssuesPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/returns"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/returns">
              <PartReturnsPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/low-stock"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/low-stock">
              <LowStockPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/to-order"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/to-order">
              <PartsToOrderPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/non-stock-items"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/non-stock-items">
              <NonStockItemsPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/movements"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/movements">
              <StockMovementsPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/kpi"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/kpi">
              <KpiTrackerPage />
            </RequireRole>
          }
        />
        <Route
          path="spare-parts/users"
          element={
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/users">
              <PartsUsersPage />
            </RequireRole>
          }
        />
      </Route>

      <Route
        path="spare-parts/store-issues/:id/print"
        element={
          <RequireAuth>
            <RequireRole roles={MODULE_ROLES.spareParts} pageKey="spare-parts/store-issues">
              <IssuePrintPage />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
