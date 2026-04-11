import './globals.css';

export const metadata = {
  title: 'AI Job Sniper',
  description: 'Precision job acquisition platform'
};

export default function RootLayout({ children }) {
  const navItems = [
    ['/dashboard', 'Dashboard'],
    ['/jobs', 'Jobs'],
    ['/packages', 'Packages'],
    ['/brain', 'Brain'],
    ['/resume-builder', 'Resume Builder'],
    ['/followups', 'Follow-ups'],
    ['/interviews', 'Interviews'],
    ['/analytics', 'Analytics'],
    ['/auto-apply', 'Auto Apply'],
    ['/settings', 'Settings']
  ];

  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div>
              <div className="brand-block">
                <h1 className="brand-title">AI Job Sniper</h1>
                <p className="brand-subtitle">Precision target acquisition for careers</p>
              </div>
              <nav className="sidebar-nav">
                {navItems.map(([href, label]) => (
                  <a key={href} href={href} className="nav-link">{label}</a>
                ))}
              </nav>
            </div>
            <div className="sidebar-footer">
              <span className="badge badge-orange">Live Build</span>
              <p>Royal Blue Ops Theme</p>
            </div>
          </aside>
          <main className="main-shell">
            <header className="topbar">
              <div>
                <h2 className="topbar-title">Your pipeline control center</h2>
                <p className="topbar-subtitle">Quiet automation. Precise targeting. Human output.</p>
              </div>
              <div className="topbar-actions">
                <a href="/jobs" className="btn btn-primary">Search Jobs</a>
                <a href="/packages" className="btn btn-secondary">Packages</a>
                <a href="/resume-builder" className="btn btn-secondary">Resume Builder</a>
                <a href="/followups" className="btn btn-secondary">Follow-ups</a>
              </div>
            </header>
            <div className="page-wrap">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
