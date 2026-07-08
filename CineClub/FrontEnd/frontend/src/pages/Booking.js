import { useEffect, useState } from "react";
import api from "../api";

const fmt = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function BookingPage() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get("/bookings/");
      const data = (r.data.results ?? r.data) || [];
      const active = data
        .filter((b) => b.status !== "cancelled")
        .sort((a, b) =>
          String(b.session_date_time || "").localeCompare(String(a.session_date_time || ""))
        );
      setItems(active);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelBooking(b) {
    setMsg("");
    setCancelingId(b.id);
    try {
      await api.delete(`/bookings/${b.id}/`);
      setMsg("Reserva apagada.");
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.detail || "Não foi possível apagar.");
    } finally {
      setCancelingId(null);
    }
  }

  if (loading) return <p className="muted container">A carregar reservas…</p>;

  return (
    <main className="container">
      <h2>Minhas reservas</h2>
      {msg && <p className="flash">{msg}</p>}

      {items.length === 0 ? (
        <p className="muted">Ainda não tens reservas ativas.</p>
      ) : (
        <div className="bookings-grid">
          {items.map((b) => (
            <div key={b.id} className="booking-card">
              <div className="booking-top">
                <div className={`status ${b.status === "reserved" ? "reserved" : ""}`}>
                  {b.status === "reserved" ? "Reservada" : b.status}
                </div>
              </div>

              <div className="booking-title">{b.movie_title || "Filme"}</div>

              <div className="booking-meta">
                <span>{b.session_room || "-"}</span>

                <span>
                  {b.session_date_time ? fmt.format(new Date(b.session_date_time)) : "-"}
                </span>
              </div>

              {b.seat ? (
                <div className="booking-meta" style={{ marginTop: 6 }}>
                  <span>
                    Lugar: <b>{b.seat}</b>
                  </span>
                </div>
              ) : null}

              <div className="booking-actions">
                <button
                  className="btn btn-secondary"
                  disabled={cancelingId === b.id}
                  onClick={() => cancelBooking(b)}
                >
                  {cancelingId === b.id ? "A cancelar…" : "Cancelar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
