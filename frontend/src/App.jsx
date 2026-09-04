import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import Dashboard from "./pages/dashboard/Dashboard";
import MyFiles from "./pages/dashboard/MyFiles";
import Trash from "./pages/dashboard/Trash";
import Recent from "./pages/dashboard/Recent";
import Folder from "./pages/dashboard/Folder";
import Starred from "./pages/dashboard/Starred"; // ✅ ADD THIS IMPORT

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-slate-700">
          Loading...
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : (
    <Navigate to="/login" replace />
  );
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/files"
        element={
          <ProtectedRoute>
            <MyFiles />
          </ProtectedRoute>
        }
      />

      <Route
        path="/recent"
        element={
          <ProtectedRoute>
            <Recent />
          </ProtectedRoute>
        }
      />

      {/* ✅ ADD THE STARRED ROUTE */}
      <Route
        path="/starred"
        element={
          <ProtectedRoute>
            <Starred />
          </ProtectedRoute>
        }
      />

      <Route
        path="/folders/:folderId"
        element={
          <ProtectedRoute>
            <Folder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/trash"
        element={
          <ProtectedRoute>
            <Trash />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;