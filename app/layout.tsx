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
    { href: "/apply", label: "Apply" }, // ✅ ADDED
    { href: "/packages", label: "Packages" },
    { href: "/brain", label: "Brain" },
    { href: "/resume-builder", label: "Resume Builder" },
    { href: "/cover-letter", label: "Cover Letter" },
    { href: "/followups", label: "Follow-ups" },
    { href: "/interviews", label: "Interviews" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          
          {/* Sidebar */}
          <aside className="sidebar">
            <div>
              <div className="brand-block">
                <h1 className="brand-title">Job Autopilot</h1>
                <p className="brand-subtitle">Sniper Mode Enabled</p>
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

          {/* Main */}
          <main className="main-shell">
            
            {/* Topbar */}
            <header className="topbar">
              <div>
                <h2 className="topbar-title">Pipeline Control System</h2>
                <p className="topbar-subtitle">
                  Hua Hin · AU Focus · Remote First
                </p>
              </div>

              <div className="topbar-actions">
                <a href="/jobs" className="btn btn-primary">
                  Search Jobs
                </a>
                <a href="/apply" className="btn btn-secondary">
                  Apply
                </a>
                <a href="/packages" className="btn btn-secondary">
                  Packages
                </a>
                <a href="/resume-builder" className="btn btn-secondary">
                  Resume
                </a>
                <a href="/cover-letter" className="btn btn-secondary">
                  Cover Letter
                </a>
                <a href="/followups" className="btn btn-secondary">
                  Follow-ups
                </a>
              </div>
            </header>

            {/* Page content */}
            <section className="page-wrap">
              {children}
            </section>

          </main>
        </div>
      </body>
    </html>
  );
}
