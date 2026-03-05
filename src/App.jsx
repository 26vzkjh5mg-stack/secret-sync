import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import GdprPage from "./pages/GdprPage";
import ActivityFormPage from "./pages/ActivityFormPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* GDPR landing page */}
        <Route path="/" element={<GdprPage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/*ActivityFormPage */}
        <Route path="/activity/:type/new" element={<ActivityFormPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;