'use client';
import * as React from 'react';

/**
 * Main 3D CMS page – loads the plain-JS CMS on the client only.
 */
export default function MainPage() {
  React.useEffect(() => {
    import('@/public/js/cms.js')
      .then((mod) => {
        if (mod?.initCMS) mod.initCMS();
        else console.error('initCMS() not found in cms.js');
      })
      .catch((err) => console.error('❌ CMS init failed:', err));
  }, []);

  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#aeb8ff' }}>Loading 3D CMS — Plain JS…</h2>
    </main>
  );
}
