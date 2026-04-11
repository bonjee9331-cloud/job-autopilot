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
  return (
    <html lang="en">
      <body className="bg-[#0b0f1a] text-white">
        <div className="flex min-h-screen">

          {/* SIDEBAR */}
          <aside className="w-64 bg-[#0f1629] border-r border-[#1c2745] p-6 flex flex-col justify-between">
            
            <div>
              {/* LOGO */}
              <div className="mb-10">
                <h1 className="text-xl font-bold tracking-tight">
                  Job Autopilot
                </h1>
                <p className="text-xs text-gray-400">
                  Automated search system
                </p>
              </div>

              {/* NAV */}
              <nav className="space-y-2 text-sm">

                <a href="/dashboard" className="nav-link">Dashboard</a>
                <a href="/jobs" className="nav-link">Jobs</a>
                <a href="/packages" className="nav-link">Packages</a>
                <a href="/followups" className="nav-link">Follow-ups</a>
                <a href="/interviews" className="nav-link">Interviews</a>
                <a href="/settings" className="nav-link">Settings</a>

              </nav>
            </div>

            {/* FOOTER */}
            <div className="text-xs text-gray-500">
              v1.0 • Ben Lynch System
            </div>

          </aside>

          {/* MAIN */}
          <main className="flex-1 flex flex-col">

            {/* TOP BAR */}
            <header className="h-16 border-b border-[#1c2745] flex items-center justify-between px-6 bg-[#0b0f1a]">
              <h2 className="text-lg font-semibold">
                Your pipeline control center
              </h2>

              <div className="text-sm text-gray-400">
                Hua Hin • AU Focus
              </div>
            </header>

            {/* PAGE CONTENT */}
            <div className="p-8">
              {children}
            </div>

          </main>

        </div>
      </body>
    </html>
  );
}
