"use client";

import { useEffect, useState } from "react";

export default function FollowUpsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    setItems(data.items || []);
  }

  async function generate(item) {
    setSelected(item);
    setLoading(true);

    const res = await fetch("/api/followups/generate", {
      method: "POST",
      body: JSON.stringify(item)
    });

    const data = await res.json();

    setEmail(data.data);
    setLoading(false);
  }

  return (
    <main className="stack">
      <h1>Follow-up System</h1>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px" }}>
        <div className="card">
          <h2>Targets</h2>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => generate(item)}
              style={{ display: "block", marginBottom: "10px" }}
            >
              {item.job_title} - {item.company}
            </button>
          ))}
        </div>

        <div className="card">
          <h2>Email</h2>

          {loading && <p>Generating...</p>}

          {email && (
            <>
              <p><strong>{email.subject}</strong></p>
              <pre>{email.email}</pre>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
