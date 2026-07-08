import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const avatar = user ? user.username[0].toUpperCase() : "";

  function toggle() {
    setOpen((o) => !o);
  }

  function close() {
    setOpen(false);
  }

  return (
    <header
      style={{
        padding: "14px 22px",
        borderBottom: "1px solid #1a1a1d",
        background: "#0d0d0f",
        color: "#eee",
        display: "flex",
        gap: 20,
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* LOGO */}
      <Link
        to="/"
        style={{
          fontWeight: 800,
          fontSize: 22,
          color: "#ff2e63",
          textDecoration: "none",
          letterSpacing: 1,
        }}
      >
        🎥 CineClub
      </Link>

      {/* NAV MENU */}
      <nav style={{ display: "flex", gap: 18 }}>
        <NavItem to="/movies" label="Filmes" />
        {user && <NavItem to="/reviews" label="Reviews" />}
        {user && <NavItem to="/bookings" label="Reservas" />}
      </nav>

      
      <div style={{ marginLeft: "auto", position: "relative" }}>
        {loading && <span style={{ opacity: 0.7 }}>A carregar…</span>}

        {!loading && !user && (
          <div style={{ display: "flex", gap: 12 }}>
            <AuthLink to="/login" label="Entrar" />
            <AuthLink to="/signup" label="Registar" />
          </div>
        )}

        {!loading && user && (
          <>
            <div
              onClick={toggle}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#ff2e63",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 17,
                cursor: "pointer",
                userSelect: "none",
                transition: ".2s",
              }}
            >
              {avatar}
            </div>

            {open && (
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  right: 0,
                  background: "#16161a",
                  border: "1px solid #222",
                  borderRadius: 10,
                  padding: 12,
                  width: 170,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  zIndex: 99,
                }}
              >
                <span style={{ fontWeight: 600, opacity: 0.9 }}>
                  {user.username}
                </span>

                <DropdownItem
                  label="Perfil"
                  link="/perfil"
                  onClick={close}
                />

                <button
                  onClick={() => {
                    logout();
                    close();
                  }}
                  style={{
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    padding: "6px 0",
                    color: "#ff2e63",
                    cursor: "pointer",
                    fontSize: "15px",
                  }}
                >
                  Sair
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}

function NavItem({ to, label }) {
  return (
    <Link
      to={to}
      style={{
        color: "#ddd",
        textDecoration: "none",
        fontSize: 16,
        padding: "4px 2px",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.target.style.color = "#ff2e63")}
      onMouseLeave={(e) => (e.target.style.color = "#ddd")}
    >
      {label}
    </Link>
  );
}

function AuthLink({ to, label }) {
  return (
    <Link
      to={to}
      style={{
        color: "#ff2e63",
        fontWeight: 600,
        textDecoration: "none",
        fontSize: 15,
      }}
    >
      {label}
    </Link>
  );
}

function DropdownItem({ label, link, onClick }) {
  return (
    <Link
      to={link}
      onClick={onClick}
      style={{
        color: "#eee",
        textDecoration: "none",
        padding: "6px 0",
        fontSize: 15,
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.target.style.color = "#ff2e63")}
      onMouseLeave={(e) => (e.target.style.color = "#eee")}
    >
      {label}
    </Link>
  );
}
