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

function AppLayout() {
  const location = useLocation();
  const showNav = ['/dashboard', '/cards', '/transfer', '/profile'].includes(location.pathname);

  return (
    <div className="flex justify-center bg-[#070b14] min-h-[100dvh] w-full">
      <div className="w-full max-w-[400px] h-[100dvh] bg-slate-900 relative overflow-hidden flex flex-col shadow-2xl sm:border-x border-slate-800">
        <div className={`flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar ${showNav ? 'pb-24' : ''}`}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/kyc" element={<Kyc />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/topup" element={<TopUp />} />
            <Route path="/support" element={<Support />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/giftcards" element={<GiftCards />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </div>
        {showNav && <Navigation />}
      </div>
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
