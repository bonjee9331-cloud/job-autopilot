import { getSupabaseServer, isSupabaseConfigured } from '../../lib/supabase';

const DEMO_JOBS = [
  {
    id: 'demo-1',
    title: 'Sales Manager',
    company: 'Tech Corp',
    location: 'Sydney',
    remote: true,
    salary: '$120k AUD',
    source: 'demo',
    fit_score: 85,
    status: 'discovered'
  },
  {
    id: 'demo-2',
    title: 'Sales Operations Manager',
    company: 'Finance Plus',
    location: 'Melbourne',
    remote: true,
    salary: '$110k AUD',
    source: 'demo',
    fit_score: 78,
    status: 'discovered'
  }
];

export default async function JobsPage() {
  let jobs = [];
  let error = null;
  let demoMode = false;

  if (!isSupabaseConfigured()) {
    jobs = DEMO_JOBS;
    demoMode = true;
  } else {
    try {
      const supabase = getSupabaseServer();
      const { data, error: err } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'discovered')
        .order('ingested_at', { ascending: false })
        .limit(100);

      if (err) throw err;
      jobs = data || [];
    } catch (err) {
      error = err.message;
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Job Board</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          Error loading jobs: {error}
        </div>
      )}

      {demoMode && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          Demo mode: No Supabase configured. Showing sample jobs.
        </div>
      )}

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <p className="text-gray-500">No jobs found</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="text-gray-600">{job.company}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {job.source}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700 mb-3">
                <div>
                  <span className="font-semibold">Location:</span> {job.location}
                </div>
                <div>
                  <span className="font-semibold">Remote:</span> {job.remote ? 'Yes' : 'No'}
                </div>
                {job.salary && (
                  <div>
                    <span className="font-semibold">Salary:</span> {job.salary}
                  </div>
                )}
                <div>
                  <span className="font-semibold">Fit:</span> {job.fit_score || 'N/A'}%
                </div>
              </div>

              {job.jd_summary && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.jd_summary}</p>
              )}

              {job.source_url && (
                
                  href={job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View Job →
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
