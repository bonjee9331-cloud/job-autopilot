import './globals.css';
import Nav from '../components/Nav';

export const metadata = {
  title: 'Job Autopilot',
  description: 'Automated job search assistant'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  );
}
