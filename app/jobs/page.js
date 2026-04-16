'use client';

import { useEffect, useState } from 'react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs/list');
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Jobs Found</h1>

      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs yet</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded p-4 bg-white shadow">
              <h2 className="text-xl font-bold">{job.title}</h2>
              <p className="text-gray-600">{job.company}</p>
              <p className="text-sm text-gray-500">{job.location} {job.remote ? '(Remote)' : ''}</p>
              {job.salary && <p className="text-sm font-semibold">{job.salary}</p>}
              <p className="text-sm text-gray-700 mt-2">{job.jd_summary}</p>
              {job.source_url && (
                <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-2 inline-block">
                  View Job →
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
