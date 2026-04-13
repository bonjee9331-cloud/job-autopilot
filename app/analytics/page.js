"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return <div className="p-6 text-white">Loading analytics...</div>;

  const s = data.summary;

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">📊 Sniper Analytics</h1>

      {/* Core Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card label="Applications" value={s.applied} />
        <Card label="Responses" value={s.shortlisted} />
        <Card label="Interviews" value={s.interviews} />
        <Card label="Offers" value={s.offers} />
      </div>

      {/* Conversion */}
      <div className="grid grid-cols-3 gap-4">
        <Card label="Apply → Response" value={`${s.responseRate}%`} />
        <Card label="Response → Interview" value={`${s.interviewRate}%`} />
        <Card label="Interview → Offer" value={`${s.offerRate}%`} />
      </div>

      {/* Time */}
      <div className="grid grid-cols-2 gap-4">
        <Card label="Avg Time to Interview" value={`${s.avgTimeToInterview} days`} />
      </div>

      {/* Insights */}
      <div className="bg-blue-900 p-4 rounded">
        <h2 className="font-bold mb-2">🧠 Insights</h2>
        <ul className="text-sm space-y-1">
          <li>• Best CV version: {data.packagePerformance?.[0]?.name || "N/A"}</li>
          <li>• Best source: {data.sourcePerformance?.[0]?.name || "N/A"}</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-blue-800 p-4 rounded">
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
