/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // ---- Media files (images, glb, etc.) ----
      { source: '/media/:path*', destination: 'http://127.0.0.1:8000/media/:path*' },

      // ---- Asset list (your front-end uses /api/asset_preview) ----
      // e.g. GET /api/asset_preview  -> Django /api/preview/assets/
      //      GET /api/asset_preview?id=33 (handled by Django list+filter or your route)
      { source: '/api/asset_preview', destination: 'http://127.0.0.1:8000/api/preview/assets/' },
      { source: '/api/asset_preview/:path*', destination: 'http://127.0.0.1:8000/api/preview/assets/:path*' },

      // ---- Direct DRF actions used by the modal ----
      // preview, download, versions, create_version, etc.
      { source: '/api/preview/assets/:path*', destination: 'http://127.0.0.1:8000/api/preview/assets/:path*' },
    ];
  },
};

module.exports = nextConfig;
