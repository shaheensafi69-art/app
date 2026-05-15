/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Kyc from "./pages/Kyc";
import Transfer from "./pages/Transfer";
import Profile from "./pages/Profile";
import TopUp from "./pages/TopUp";
import Support from "./pages/Support";
import Withdraw from "./pages/Withdraw";
import GiftCards from "./pages/GiftCards";
import Notifications from "./pages/Notifications";
import Navigation from "./components/Navigation";
import SecurityLock from "./components/SecurityLock";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userId = localStorage.getItem('userId');
  if (!userId) {
     return <Welcome />;
  }
  return <SecurityLock>{children}</SecurityLock>;
}

function AppLayout() {
  const location = useLocation();
  const showNav = ['/dashboard', '/cards', '/transfer', '/profile'].includes(location.pathname);

  return (
    <div className="bg-slate-900 text-slate-50 w-full h-[100dvh] relative overflow-hidden flex flex-col">
      <div className={`w-full flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar ${showNav ? 'pb-24' : ''}`}>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/kyc" element={<ProtectedRoute><Kyc /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/cards" element={<ProtectedRoute><Cards /></ProtectedRoute>} />
          <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
          <Route path="/giftcards" element={<ProtectedRoute><GiftCards /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Routes>
      </div>
      {showNav && <Navigation />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}
