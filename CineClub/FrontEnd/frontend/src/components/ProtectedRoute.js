import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="muted" style={{ padding: 16 }}>A verificar sessão…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
