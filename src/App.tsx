/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { BannerDisplay } from './components/BannerDisplay';
import { Home } from './pages/Home';
import { RegisterRole } from './pages/RegisterRole';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { CompanyDashboard } from './pages/CompanyDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
          <BannerDisplay />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register-role" element={<RegisterRole />} />
            <Route path="/worker-dashboard" element={<WorkerDashboard />} />
            <Route path="/company-dashboard" element={<CompanyDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
