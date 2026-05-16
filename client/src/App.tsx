import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Join from "./pages/Join";
import Room from "./pages/Room";
import ProtectedRoute from "./components/ProtectedRoute";
import Feedback from "./pages/Feedback";
import Sessions from "./pages/Sessions";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/room/:code" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="/feedback/:sessionId" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
<Route path="/sessions"            element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}