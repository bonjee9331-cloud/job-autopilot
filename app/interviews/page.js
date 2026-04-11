"use client";

import { useEffect, useState } from "react";

export default function InterviewPrepPage() {
  const [packages, setPackages] = useState([]);
  const [prep, setPrep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      const res = await fetch("/api/packages");
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON returned while loading packages");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load packages");
      }

      setPackages(data.packages || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load packages");
    }
  }

  async function generatePrep(pkg) {
    setLoading(true);
    setError("");
    setPrep(null);

    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          job_title: pkg.job_title,
          company: pkg.company,
          job_description: pkg.job_description,
          tailoredSummary: pkg.tailored_summary,
          tailoredExperienceBullets: pkg.tailored_experience_bullets || [],
          tailoredSkills: pkg.tailored_skills || []
        })
      });

      const text = await res.text();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON returned from interview prep API");
      }

      if (!parsed.ok) {
        throw new Error(parsed.error || "Interview prep failed");
      }

      setPrep(parsed.data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Interview prep failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 text-white max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Interview Prep Engine</h1>

      <div className="grid grid-cols-3 gap-6">
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

        <div className="col-span-2 space-y-4">
          {loading && <div>Generating interview prep...</div>}

          {error && (
            <div className="text-red-400 border p-3 rounded">
              Error: {error}
            </div>
          )}

          {prep && (
            <>
              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">🔥 60s Pitch</h2>
                <p>{prep.pitch}</p>
              </div>

              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Questions</h2>
                {(prep.questions || []).map((q, i) => (
                  <p key={i}>• {q}</p>
                ))}
              </div>

              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Answers</h2>
                {(prep.answers || []).map((a, i) => (
                  <p key={i}>• {a}</p>
                ))}
              </div>

              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Company Angles</h2>
                {(prep.companyAngles || []).map((c, i) => (
                  <p key={i}>• {c}</p>
                ))}
              </div>

              <div className="border p-4 rounded">
                <h2 className="font-bold mb-2">Red Flags</h2>
                {(prep.redFlags || []).map((r, i) => (
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
