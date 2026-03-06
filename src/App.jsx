import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import GdprPage from "./pages/GdprPage";
import ActivityFormPage from "./pages/ActivityFormPage";
import CalendarPage from "./pages/CalendarPage";

const KEY_GDPR = "ss_gdpr_accepted";
const KEY_LOGIN_NICKNAME = "ss_login_nickname";
const KEY_SESSION_NICKNAME = "ss_session_nickname";
const KEY_PIN = "ss_session_pin";

function hasAcceptedGdpr() {
  return localStorage.getItem(KEY_GDPR) === "true";
}

function hasPinSetup() {
  const pin = localStorage.getItem(KEY_PIN);
  return Boolean(pin && /^\d{4}$/.test(pin));
}

function hasStoredLoginNickname() {
  const nickname = localStorage.getItem(KEY_LOGIN_NICKNAME);
  return Boolean(nickname && nickname.trim().length > 0);
}

function hasActiveSession() {
  const sessionNickname = localStorage.getItem(KEY_SESSION_NICKNAME);
  const storedNickname = localStorage.getItem(KEY_LOGIN_NICKNAME);

  return Boolean(
    sessionNickname &&
      storedNickname &&
      sessionNickname.trim().length > 0 &&
      sessionNickname === storedNickname
  );
}

function logoutSession() {
  localStorage.removeItem(KEY_SESSION_NICKNAME);
}

function ProtectedRoute({ children }) {
  const gdprAccepted = hasAcceptedGdpr();
  const pinSetup = hasPinSetup();
  const loginNicknameExists = hasStoredLoginNickname();
  const sessionActive = hasActiveSession();

  if (!gdprAccepted) {
    return <Navigate to="/" replace />;
  }

  if (!pinSetup || !loginNicknameExists || !sessionActive) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function LoginRoute() {
  const gdprAccepted = hasAcceptedGdpr();
  const pinSetup = hasPinSetup();
  const loginNicknameExists = hasStoredLoginNickname();
  const sessionActive = hasActiveSession();

  if (!gdprAccepted) {
    return <Navigate to="/" replace />;
  }

  if (pinSetup && loginNicknameExists && sessionActive) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginPage />;
}

function GdprRoute() {
  const gdprAccepted = hasAcceptedGdpr();
  const pinSetup = hasPinSetup();
  const loginNicknameExists = hasStoredLoginNickname();
  const sessionActive = hasActiveSession();

  if (gdprAccepted && pinSetup && loginNicknameExists && sessionActive) {
    return <Navigate to="/dashboard" replace />;
  }

  if (gdprAccepted) {
    return <Navigate to="/login" replace />;
  }

  return <GdprPage />;
}

function DashboardRouteWrapper() {
  const navigate = useNavigate();

  function handleLock() {
    logoutSession();
    navigate("/login", { replace: true });
  }

  return <DashboardPage onLock={handleLock} />;
}

function CalendarRouteWrapper() {
  return <CalendarPage />;
}

function ActivityNewRouteWrapper() {
  return <ActivityFormPage />;
}

function ActivityEditRouteWrapper() {
  return <ActivityFormPage mode="edit" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GdprRoute />} />
        <Route path="/login" element={<LoginRoute />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRouteWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity/:type/new"
          element={
            <ProtectedRoute>
              <ActivityNewRouteWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarRouteWrapper />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity/:type/edit/:id"
          element={
            <ProtectedRoute>
              <ActivityEditRouteWrapper />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;