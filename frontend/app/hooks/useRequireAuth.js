'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, [router]);

  return { ready };
}
