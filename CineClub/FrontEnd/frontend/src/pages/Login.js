import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { login } = useAuth();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const location = useLocation(); 

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await login(username, password);
      if (u) {
        const next = location.state?.next;
        nav(next || "/", { replace: true });
      } else {
        setErr("Não foi possível iniciar sessão.");
      }
    } catch (e2) {
      setErr(e2?.response?.data?.detail || "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h2>Entrar</h2>
      <form onSubmit={onSubmit} className="space">
        <input
          placeholder="Username"
          value={username}
          onChange={e=>setU(e.target.value)}
          autoFocus
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e=>setP(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "A entrar…" : "Entrar"}
        </button>
        {err && <p className="space" style={{ color: "crimson" }}>{err}</p>}
      </form>

      <p className="muted">
        Ainda não tens conta? <Link to="/signup">Registar</Link>
      </p>
    </main>
  );
}
