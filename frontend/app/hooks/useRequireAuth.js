'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Prevent back button showing cached pages
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', window.location.href);
    });

    const token = localStorage.getItem('token');

    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }

    return () => {
      window.removeEventListener('popstate', () => {});
    };
  }, [router]);

  return { ready };
}
