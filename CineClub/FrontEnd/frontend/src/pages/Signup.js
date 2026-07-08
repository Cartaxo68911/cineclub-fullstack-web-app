import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Signup(){
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [ok,setOk] = useState(false);
  const [error,setError] = useState("");
  const nav = useNavigate();
  const { signup } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(username, password);
      setOk(true);
      setTimeout(()=> nav("/login"), 800);
    } catch (err) {
      setError("Não foi possível registar (username pode já existir).");
    }
  };

  return (
    <main style={{ padding:16 }}>
      <h2>Registar</h2>
      <form onSubmit={onSubmit} style={{ display:"grid", gap:8, maxWidth:320 }}>
        <input type="text" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={3}/>
        <button>Registar</button>
        {ok && <p style={{ color:"green" }}>Conta criada! Redirecionar…</p>}
        {error && <p style={{ color:"crimson" }}>{error}</p>}
      </form>
    </main>
  );
}
