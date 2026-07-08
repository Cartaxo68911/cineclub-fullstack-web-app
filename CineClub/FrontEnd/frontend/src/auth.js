import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const r = await api.get("/user/");
      const u = r.data?.authenticated
        ? { id: r.data.id, username: r.data.username }
        : null;
      setUser(u);
      return u;                       
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshMe(); }, []);

  async function login(username, password) {
    await api.post("/login/", { username, password });
    return await refreshMe();         
  }

  async function signup(username, password) {
    await api.post("/signup/", { username, password });
    return await refreshMe();
  }

  async function logout() {
    try {
      await api.post("/logout/");
    } catch (e) {
      console.warn("logout error:", e?.response?.status || e?.message);
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, refreshMe }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { return useContext(AuthCtx); }
