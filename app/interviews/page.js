"use client";

import { useEffect, useState } from "react";

export default function InterviewPrepPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [prep, setPrep] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      setPackages(data.data || []);
    } catch {
      setError("Failed to load packages");
    }
  }

  async function generatePrep(pkg: any) {
    setLoading(true);
    setError("");
    setPrep(null);

    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        body: JSON.stringify(pkg),
      });

      const text = await res.text();

      // 🔥 SAFE JSON PARSE (this prevents your crash)
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON returned from API");
      }

      if (!parsed.ok) {
        throw new Error(parsed.error || "Failed");
      }

      setPrep(parsed.data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  }

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Interview Prep Engine</h1>

      <div className="grid grid-cols-3 gap-6">

        {/* LEFT */}
        <div className="space-y-2">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border p-3 rounded cursor-pointer hover:bg-blue-900"
              onClick={() => generatePrep(pkg)}
            >
              <div className="font-semibold">{pkg.job_title}</div>
              <div className="text-sm opacity-70">{pkg.company}</div>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="col-span-2 space-y-4">

          {loading && <div>Generating interview prep...</div>}

          {error && (
            <div className="text-red-400 border p-3 rounded">
              Error: {error}
            </div>
          )}

          {prep && (
            <>
              {/* PITCH */}
              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">🔥 60s Pitch</h2>
                <p>{prep.pitch}</p>
              </div>

              {/* QUESTIONS */}
              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Questions</h2>
                {prep.questions?.map((q: string, i: number) => (
                  <p key={i}>• {q}</p>
                ))}
              </div>

              {/* ANSWERS */}
              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Answers</h2>
                {prep.answers?.map((a: string, i: number) => (
                  <p key={i}>• {a}</p>
                ))}
              </div>

              {/* COMPANY */}
              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Company Angles</h2>
                {prep.companyAngles?.map((c: string, i: number) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>

              {/* RED FLAGS */}
              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Red Flags</h2>
                {prep.redFlags?.map((r: string, i: number) => (
                  <p key={i}>• {r}</p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
