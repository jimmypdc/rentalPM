"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          background: "#f7f8fa",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Application error</h2>
          <p style={{ color: "#64748b", fontSize: 14 }}>
            A critical error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
