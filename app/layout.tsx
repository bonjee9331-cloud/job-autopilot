import "./globals.css";

export const metadata = {
  title: "Job Autopilot",
  description: "Automated job search assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/jobs", label: "Jobs" },
    { href: "/packages", label: "Packages" },
    { href: "/brain", label: "Brain" },
    { href: "/resume-builder", label: "Resume Builder" },
    { href: "/followups", label: "Follow-ups" },
    { href: "/interviews", label: "Interviews" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div>
              <div className="brand-block">
                <h1 className="brand-title">Job Autopilot</h1>
                <p className="brand-subtitle">Automated search system</p>
              </div>

              <nav className="sidebar-nav">
                {navItems.map((item) => (
                  <a key={item.href} href={item.href} className="nav-link">
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="sidebar-footer">
              <div className="badge badge-orange">Live Build</div>
              <p>Ben Lynch System</p>
            </div>
          </aside>

          <main className="main-shell">
            <header className="topbar">
              <div>
                <h2 className="topbar-title">Your pipeline control center</h2>
                <p className="topbar-subtitle">Hua Hin · AU focus · remote-first workflow</p>
              </div>

              <div className="topbar-actions">
                <a href="/jobs" className="btn btn-primary">Search Jobs</a>
                <a href="/packages" className="btn btn-secondary">Open Packages</a>
                <a href="/resume-builder" className="btn btn-secondary">Resume Builder</a>
                <a href="/followups" className="btn btn-secondary">Follow-ups</a>
              </div>
            </header>

            <section className="page-wrap">{children}</section>
          </main>
        </div>
      </body>
    </html>
  );
}
