import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";

// Auth Pages
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

// Layout
import DashboardLayout from "./layout/DashboardLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Host Pages
import HostDashboard from "./pages/Host/Dashboard";
import WhatsAppConnection from "./pages/Host/WhatsAppConnection";
import Messages from "./pages/Host/Messages";
import Conversation from "./pages/Host/Conversation";
import Guests from "./pages/Host/Guests";
import BlockedNumbers from "./pages/Host/BlockedNumbers";
import HostProfile from "./pages/Host/Profile";
import Withdrawals from "./pages/Host/Withdrawals";

// Admin Pages
import AdminDashboard from "./pages/Admin/Dashboard";
import Users from "./pages/Admin/Users";
import PendingApprovals from "./pages/Admin/PendingApprovals";
import BlockRequests from "./pages/Admin/BlockRequests";
import Sessions from "./pages/Admin/Sessions";
import Settings from "./pages/Admin/Settings";
import CreateAdmin from "./pages/Admin/CreateAdmin";
import HostDetail from "./pages/Admin/HostDetail";
import FeedbackList from "./pages/Admin/FeedbackList";
import WithdrawalsPage from "./pages/Admin/WithdrawalsPage";
import CommissionRulesPage from "./pages/Admin/CommissionRulesPage";

// Financial Host Pages
import HostWalletPage from "./pages/Host/HostWalletPage";
import HostBookingsPage from "./pages/Host/HostBookingsPage";


import { ScrollToTop } from "./components/common/ScrollToTop";
import HostUsersPage from "./pages/Admin/HostUsersPage.tsx";

export default function App() {
  return (
    <SocketProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Host Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedUserTypes={["host"]}>
                <DashboardLayout variant="host" />
              </ProtectedRoute>
            }
          >
            <Route index path="/host" element={<HostDashboard />} />
            <Route path="/host/whatsapp" element={<WhatsAppConnection />} />
            <Route path="/host/messages" element={<Messages />} />
            <Route path="/host/conversation/:guestId" element={<Conversation />} />
            <Route path="/host/guests" element={<Guests />} />
            <Route path="/host/blocked-numbers" element={<BlockedNumbers />} />
            <Route path="/host/profile" element={<HostProfile />} />
            <Route path="/host/wallet" element={<HostWalletPage />} />
            <Route path="/host/bookings" element={<HostBookingsPage />} />
            <Route path="/host/withdrawals" element={<Withdrawals />} />

          </Route>

          {/* Admin Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute allowedUserTypes={["admin"]}>
                <DashboardLayout variant="admin" />
              </ProtectedRoute>
            }
          >
            <Route index path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/users/pending" element={<PendingApprovals />} />
            <Route path="/admin/host-users" element={<HostUsersPage/>} />
            <Route path="/admin/block-requests" element={<BlockRequests />} />
            <Route path="/admin/sessions" element={<Sessions />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/hosts/:hostId" element={<HostDetail />} />
            <Route path="/admin/create-admin" element={<CreateAdmin />} />
            <Route path="/admin/feedback" element={<FeedbackList />} />
            <Route path="/admin/withdrawals" element={<WithdrawalsPage />} />
            <Route path="/admin/commission-rules" element={<CommissionRulesPage />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { zIndex: 9999 }
        }}
      />
    </SocketProvider>
  );
}
