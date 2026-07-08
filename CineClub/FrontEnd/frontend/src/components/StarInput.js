import React from "react";

export default function StarInput({ value = 0, onChange }) {
  const n = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div style={{ display: "inline-flex", gap: 6 }}>
      {[0,1,2,3,4,5].map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="btn-small"
          style={{
            background: v <= n ? "#ff2e63" : "#26262b",
            borderColor: v <= n ? "#ff4a79" : "#34343a",
            minWidth: 36
          }}
          title={`${v} estrelas`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
