import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import Booking from "@/pages/Booking";
import Works from "@/pages/Works";
import WorkUpload from "@/pages/WorkUpload";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/stores/authStore";

function AppContent() {
  const location = useLocation();
  const { initAuth } = useAuthStore();
  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen bg-dark-900">
      {!isLoginPage && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/works" element={<Works />} />
        <Route path="/works/upload" element={<WorkUpload />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/bookings" element={<Profile />} />
        <Route path="/profile/works" element={<Profile />} />
        <Route path="/profile/payments" element={<Profile />} />
        <Route path="/profile/settings" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/studios" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<AdminDashboard />} />
        <Route path="/admin/pricing" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
