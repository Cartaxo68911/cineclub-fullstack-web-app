import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";   
import api from "../api";
import { useAuth } from "../auth";

const GENRES = [
  "", "Ação", "Aventura", "Animação", "Comédia", "Drama",
  "Fantasia", "Ficção Científica", "Terror", "Romance", "Thriller"
];

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();                

  const [form, setForm] = useState({
    display_name: "",
    favorite_genre: "",
    email: "",
    phone: "",
    birth_date: "",
    address: "",
    nationality: "",
  });

  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!loading && user) {
      api.get("/profiles/my/").then((r) => {
        setForm({
          display_name: r.data.display_name || "",
          favorite_genre: r.data.favorite_genre || "",
          email: r.data.email || "",
          phone: r.data.phone || "",
          birth_date: r.data.birth_date || "",
          address: r.data.address || "",
          nationality: r.data.nationality || "",
        });
      });
    }
  }, [loading, user]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setStatus("");

    try {
      const r = await api.patch("/profiles/my/", {
        display_name: form.display_name,
        favorite_genre: form.favorite_genre,
        email: form.email,
        phone: form.phone,
        birth_date: form.birth_date || null,
        address: form.address,
        nationality: form.nationality,
      });

      setForm(r.data);
      setStatus("Guardado!");

      navigate("/");

    } catch (e2) {
      const msg =
        e2?.response?.data?.display_name?.[0] ||
        e2?.response?.data?.email?.[0] ||
        e2?.response?.data?.phone?.[0] ||
        e2?.response?.data?.detail ||
        "Erro ao guardar.";

      setStatus(msg);
    }
  }

  if (loading)
    return <p className="muted" style={{ padding: 16 }}>A carregar…</p>;

  if (!user)
    return <p style={{ padding: 16 }}>Precisas de iniciar sessão.</p>;

  return (
    <main className="container" style={{ maxWidth: 640 }}>
      <h2>O meu perfil</h2>

      <form
        onSubmit={onSave}
        className="space"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>Nome de exibição</label>
        <input
          value={form.display_name}
          onChange={(e) => setField("display_name", e.target.value)}
        />

        <label>Género favorito</label>
        <select
          value={form.favorite_genre}
          onChange={(e) => setField("favorite_genre", e.target.value)}
        >
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g || "— Nenhum —"}
            </option>
          ))}
        </select>

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
        />

        <label>Telefone</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setField("phone", e.target.value)}
        />

        <label>Data de nascimento</label>
        <input
          type="date"
          value={form.birth_date || ""}
          onChange={(e) => setField("birth_date", e.target.value)}
        />

        <label>Morada</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
        />

        <label>Nacionalidade</label>
        <input
          type="text"
          value={form.nationality}
          onChange={(e) => setField("nationality", e.target.value)}
        />

        <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>
          Guardar
        </button>

        {status && (
          <p className="muted" style={{ marginTop: 8 }}>
            {status}
          </p>
        )}
      </form>
    </main>
  );
}
