import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import GdprPage from "./pages/GdprPage";
import ActivityFormPage from "./pages/ActivityFormPage";
import CalendarPage from "./pages/CalendarPage";

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

        {/*CalendarPage */}
        <Route path="/calendar" element={<CalendarPage />} />

        {/*ActivityFormPageEdit */}
        <Route path="/activity/:type/edit/:id" element={<ActivityFormPage mode="edit" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;