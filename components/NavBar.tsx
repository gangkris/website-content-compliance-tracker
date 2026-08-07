'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <div className="max-w-4xl mx-auto w-full px-8 pt-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-black">
        ← Back to dashboard
      </Link>
    </div>
  );
}
