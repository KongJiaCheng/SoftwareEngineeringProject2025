'use client';
import React, { useEffect } from 'react';

/**
 * Main 3D CMS page – integrates Upload feature with cms.js
 */
export default function MainPage() {
  useEffect(() => {
    import('@/public/js/cms.js')
      .then((mod) => {
        if (mod?.initCMS) mod.initCMS();
        else console.error('initCMS() not found in cms.js');
      })
      .catch((err) => console.error('❌ CMS init failed:', err));
  }, []);

  return (
    <main style={{ padding: '20px', textAlign: 'center' }}>
      <h2 style={{ color: '#aeb8ff' }}>Loading 3D CMS — with Upload</h2>
    </main>
  );
}
