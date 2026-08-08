'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  const isDashboard = pathname === '/';

  return (
    <div className="nav">
      <Link href="/" className="nav-brand">
        Compliance Tracker
      </Link>
      {isDashboard ? (
        <Link href="/records/new" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          + New record
        </Link>
      ) : (
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>
      )}
    </div>
  );
}
