// cms.js — keep main code, add modal (preview + details + actions) — wired to Django/Next APIs (NO UPLOAD)
export function initCMS() {
  (function () {
    console.log('✅ Initializing 3D CMS (no upload) with Advanced Metadata Filters + Detail Modal');

    // === Utility ===
    const el = (tag, attrs = {}, children = []) => {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on') && typeof v === 'function')
          node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'style' && typeof v === 'object')
          Object.assign(node.style, v);
        else node.setAttribute(k, v);
      }
      for (const c of [].concat(children || []))
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      return node;
    };

    const injectCSS = (css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    };

    // Babylon Viewer loader (for GLB/GLTF/FBX/OBJ)
    const ensureBabylonViewer = () => {
      if (document.querySelector('script[data-babylon-viewer]')) return;
      const s = document.createElement('script');
      s.type = 'module';
      s.dataset.babylonViewer = '1';
      s.src = 'https://cdn.jsdelivr.net/npm/@babylonjs/viewer/dist/babylon-viewer.esm.min.js';
      document.head.appendChild(s);
    };

    // ===== API endpoints (Next proxy + direct Django actions) =====
    const API = {
      list: '/api/asset_preview', // Next.js route -> Django /api/preview/assets/
      detail: (id) => `/api/asset_preview?id=${id}`,
      preview: (id) => `/api/preview/assets/${id}/preview/`,
      download: (id) => `/api/preview/assets/${id}/download/`,
      versions: (id) => `/api/preview/assets/${id}/versions/`,
      createVersion: (id) => `/api/preview/assets/${id}/create_version/`,
      credentials: 'include',
    };

    // 🔑 Serve media from Django: set to '/media/' if you rewrote it in next.config.js,
    // or set absolute 'http://127.0.0.1:8000/media/' if you don't proxy.
    const MEDIA_BASE =
      document.querySelector('meta[name="media-url"]')?.content ||
      '/media/';

    // === Styles ===
    injectCSS(`
      body { margin:0; font-family:Inter, sans-serif; background:#0b0e1b; color:#e9ecff; }
      .cms-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 24px; background:#131833; border-bottom:1px solid #22284a; }
      .cms-title { font-size:18px; font-weight:600; color:#a277ff; }
      .btn { padding:8px 18px; border-radius:10px; background:#7aa2ff; color:#fff; border:none; cursor:pointer; font-size:15px; transition:0.2s; }
      .btn:hover { opacity:0.9; }
      .cms-body { padding:28px; display:grid; gap:28px; }
      .cms-grid { display:grid; gap:22px; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
      .cms-card { background:#171c3f; border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:10px; box-shadow:0 0 10px rgba(0,0,0,0.2); transition:all 0.2s; cursor:pointer; }
      .cms-card h3 { margin:0; font-size:16px; font-weight:500; }
      .cms-type { font-size:13px; color:#b0b5e0; }
      .cms-tags { display:flex; gap:6px; flex-wrap:wrap; }
      .cms-tag { background:#222856; border-radius:6px; padding:3px 7px; font-size:12px; color:#7aa2ff; }

      /* Filters */
      .filter-bar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
      .filter-input { flex:1; padding:8px 12px; border-radius:8px; background:#131833; border:1px solid #2c3261; color:#e9ecff; }
      .filter-select { padding:8px 12px; border-radius:8px; background:#131833; border:1px solid #2c3261; color:#e9ecff; cursor:pointer; }

      /* Modal */
      .modal{ position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:9999; }
      .panel{ width:min(1100px,94vw); height:min(80vh,780px); background:#0f1430; border:1px solid #26306b; border-radius:16px; display:grid; grid-template-columns:1.6fr 1fr; overflow:hidden; position:relative; }
      .left{ background:#0a0f2b; display:flex; align-items:center; justify-content:center; }
      .right{ padding:18px; overflow:auto; }
      .close{ position:absolute; top:12px; right:12px; background:#26306b; color:#e9ecff; border:none; border-radius:10px; padding:6px 10px; cursor:pointer; }
      .viewer{ width:100%; height:100%; }
      .modal-img{ max-width:100%; max-height:100%; border-radius:12px; }
      .meta{ font-size:14px; color:#c9d2ff; line-height:1.6 }
      .meta dt{ color:#8ea2ff; font-weight:600; margin-top:8px }
      .meta dd{ margin:0 0 4px 0 }
      .row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:10px }
      .badge{ display:inline-block; padding:2px 8px; border-radius:999px; background:#222856; color:#7aa2ff; font-size:12px }
    `);

    // === DOM structure (NO upload button/zone) ===
    const grid = el('div', { class: 'cms-grid', id: 'cmsGrid' });

    const filterBar = el('div', { class: 'filter-bar' }, [
      el('input', {
        class: 'filter-input',
        placeholder: '🔍 Search assets...',
        id: 'filterSearch',
        oninput: applyFilters,
      }),
      el('select', { class: 'filter-select', id: 'filterType', onchange: applyFilters }, [
        el('option', { value: 'all' }, ['All Types']),
        el('option', { value: '3d' }, ['3D Assets']),
        el('option', { value: 'image' }, ['Images']),
        el('option', { value: 'other' }, ['Other Files']),
      ]),
      el('select', { class: 'filter-select', id: 'filterSize', onchange: applyFilters }, [
        el('option', { value: 'all' }, ['All Sizes']),
        el('option', { value: 'small' }, ['Small (<5MB)']),
        el('option', { value: 'medium' }, ['Medium (5–50MB)']),
        el('option', { value: 'large' }, ['Large (>50MB)']),
      ]),
      el('select', { class: 'filter-select', id: 'filterDate', onchange: applyFilters }, [
        el('option', { value: 'all' }, ['All Time']),
        el('option', { value: '24h' }, ['Last 24h']),
        el('option', { value: '7d' }, ['Last 7 Days']),
        el('option', { value: '30d' }, ['Last 30 Days']),
      ]),
    ]);

    const root = el('div', { class: 'cms-root' }, [
      el('div', { class: 'cms-topbar' }, [
        el('div', { class: 'cms-title' }, ['ModelVerse']),
        el('button', {class: 'btn',id: 'uploadBtn',onclick: () => { window.location.href = '/upload'; }}, ['Upload']),
      ]),
      el('div', { class: 'cms-body' }, [filterBar, grid]),
    ]);

    document.body.innerHTML = '';
    document.body.appendChild(root);

    // === Data & Filters ===
    let allAssets = [];

    function fileExtFromName(name = '') {
      const dot = name.lastIndexOf('.');
      return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
    }

    function applyFilters() {
      const search = (document.getElementById('filterSearch').value || '').toLowerCase();
      const type = document.getElementById('filterType').value;
      const size = document.getElementById('filterSize').value;
      const date = document.getElementById('filterDate').value;

      const now = new Date();
      const filtered = allAssets.filter(a => {
        const nameMatch = (a.name || '').toLowerCase().includes(search);
        const tagMatch = (a.tags || []).some(t => (t || '').toLowerCase().includes(search));

        const is3d = ['glb','gltf','obj','fbx','zip'].includes((a.extension || '').toLowerCase());
        const isImg = (a.type === 'image') || (a.tags || []).includes('image');
        const typeMatch =
          type === 'all' ||
          (type === '3d' && is3d) ||
          (type === 'image' && isImg) ||
          (type === 'other' && !is3d && !isImg);

        const sizeMB = (a.size || 0) / 1048576;
        const sizeMatch =
          size === 'all' ||
          (size === 'small' && sizeMB < 5) ||
          (size === 'medium' && sizeMB >= 5 && sizeMB <= 50) ||
          (size === 'large' && sizeMB > 50);

        const ageHours = (now - new Date(a.uploadedAt || a.createdAt || now)) / 36e5;
        const dateMatch =
          date === 'all' ||
          (date === '24h' && ageHours <= 24) ||
          (date === '7d' && ageHours <= 168) ||
          (date === '30d' && ageHours <= 720);

        return (nameMatch || tagMatch) && typeMatch && sizeMatch && dateMatch;
      });

      const gridNode = document.getElementById('cmsGrid');
      gridNode.innerHTML = '';
      filtered.forEach(asset => gridNode.appendChild(createAssetCard(asset)));
    }

    function createAssetCard(data) {
      const cardChildren = [
        el('div', { class: 'cms-type' }, [data.extension?.toUpperCase() || (data.type || '').toUpperCase() || '']),
        el('h3', null, [data.name]),
        el('div', null, [`${(data.size / 1048576).toFixed(2)} MB`]),
        el('div', { style: 'font-size:12px;color:#8a8fae;' }, [
          data.uploadedAt ? `📅 ${new Date(data.uploadedAt).toLocaleDateString()}` :
          (data.modifiedAt ? `📅 ${new Date(data.modifiedAt).toLocaleDateString()}` : ''),
        ]),
      ];

      if (data.thumbnail_url && (data.type === 'image' || ['jpg','jpeg','png','gif','webp'].includes((data.extension||'').toLowerCase()))) {
        cardChildren.push(
          el('img', {
            src: data.thumbnail_url,
            style: { width: '100%', borderRadius: '10px', marginTop: '8px', objectFit: 'cover' },
          })
        );
      }

      cardChildren.push(
        el('div', { class: 'cms-tags' },
          (data.tags || []).map(t => el('div', { class: 'cms-tag' }, [t]))
        ),
        el('div', { style: 'display:flex;gap:10px;margin-top:6px;' }, [
          el('button', { class: 'btn', onclick: () => { window.location.href = '/edit/${asset.id'; }}, ['Edit']),
        ]),
        el('button', { class: 'btn', onclick: (e)=>{ e.stopPropagation(); doDownload(data);} }, ['Download'])
      );

      return el('div', { class: 'cms-card', onclick: () => openAssetModal(data) }, cardChildren);
    }

    // === Actions ===
    function doDownload(asset) {
      const url = API.download(asset.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = asset.name || true;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    async function doDelete(asset) {
      alert(`Delete ${asset.name} (hook your API here)`);
    }

    async function doEdit(asset) {
      alert(`Edit ${asset.name} (open your form / route here)`);
    }

    // Modal: preview + metadata + actions
    async function openAssetModal(asset) {
      ensureBabylonViewer();

      // Fetch preview info from backend
      let previewInfo = null;
      try {
        const r = await fetch(API.preview(asset.id), { credentials: API.credentials });
        if (r.ok) {
          const j = await r.json();
          previewInfo = j?.previews || null;
        }
      } catch (e) {
        console.error('Preview fetch failed', e);
      }

      const ext = (asset.extension || '').toLowerCase();
      const is3D = ['glb','gltf','obj','fbx'].includes(ext);
      const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext);
      const modal = el('div', { class:'modal', onclick: (e) => { if (e.target === e.currentTarget) modal.remove(); } });
      const panel = el('div', { class:'panel' });
      const left  = el('div', { class:'left' });
      const right = el('div', { class:'right' });

      const prevURL = previewInfo?.preview_url || asset.url;

      if (prevURL && is3D) {
        left.appendChild(el('babylon-viewer', { class:'viewer', source: prevURL, environment:'auto' }));
      } else if (prevURL && isImg) {
        left.appendChild(el('img', { class:'modal-img', src: prevURL, alt: asset.name || '' }));
      } else if (prevURL && asset.type === 'pdf') {
        left.appendChild(el('iframe', { class:'viewer', src: prevURL, style:'width:100%;height:100%;border:0' }));
      } else if (prevURL) {
        left.appendChild(el('a', { href: prevURL, target: '_blank', style:'color:#9fb0ff' }, ['Open preview']));
      } else {
        left.appendChild(el('div', { style:'color:#9fb0ff;font-size:14px' }, ['No preview available for this file type.']));
      }

      right.appendChild(el('h3', null, [asset.name || '(no name)']));

      const meta = el('dl', { class:'meta' });
      const add = (k, v) => { meta.appendChild(el('dt', null, [k])); meta.appendChild(el('dd', null, [v])); };
      add('File Name', asset.name || '—');
      add('File Type', asset.type?.toUpperCase() || ext.toUpperCase() || '—');
      add('Size', asset.size ? `${(asset.size/1048576).toFixed(2)} MB` : '—');
      add('Location', asset.location || '—');
      add('Created', asset.createdAt ? new Date(asset.createdAt).toLocaleString() : '—');
      add('Modified', asset.modifiedAt ? new Date(asset.modifiedAt).toLocaleString() : '—');
      add('Modified By', asset.modifiedBy || '—');
      if (asset.resolution) add('Resolution', String(asset.resolution));
      if (asset.polygonCount) add('Polygon Count', String(asset.polygonCount));
      add('No. of Versions', asset.versionCount != null ? String(asset.versionCount) : '—');

      // Asset ID + Copy
      meta.appendChild(el('dt', null, ['Asset ID']));
      const idVal = asset.id != null ? String(asset.id) : '—';
      meta.appendChild(
        el('dd', null, [
          el('span', { style:'margin-right:6px' }, [idVal]),
          el('button', { class:'btn', style:'padding:4px 8px', onclick: async () => {
            try { await navigator.clipboard.writeText(idVal); alert('Copied'); } catch {}
          }}, ['Copy'])
        ])
      );

      // Tags
      meta.appendChild(el('dt', null, ['Tags']));
      meta.appendChild(el('dd', null, [
        ...(asset.tags?.length ? asset.tags.map(t => el('span', { class:'badge' }, [t])) : ['—'])
      ]));

      right.appendChild(meta);

      // Actions
      const actions = el('div', { class:'row' }, [
        el('button', { class: 'btn', onclick: () => { window.location.href = '/edit/${asset.id'; }}, ['Edit']),
        el('button', { class:'btn', onclick: ()=>doDownload(asset) }, ['Download']),
        el('button', { class:'btn', onclick: ()=>modal.remove() }, ['Close']),
      ]);
      right.appendChild(actions);

      panel.appendChild(left);
      panel.appendChild(right);
      panel.appendChild(el('button', { class:'close', onclick: () => modal.remove() }, ['✕']));
      modal.appendChild(panel);
      document.body.appendChild(modal);
    }

    // === Refresh: fetch real data from API (no dummy data, no upload) ===
    async function refreshAssets() {
      try {
        const res = await fetch(API.list, { credentials: API.credentials });
        if (!res.ok) throw new Error(`List failed: ${res.status}`);
        const items = await res.json();
        const results = Array.isArray(items) ? items : items.results || [];

        allAssets = results.map(r => {
          const ext = fileExtFromName(r.file_name);
          // Build a browser-usable URL from your stored file_location (e.g. "image/logo.png")
          const webPath = r.file_location
            ? (MEDIA_BASE + String(r.file_location).replace(/^\/+/, ''))
            : null;

          const imgExts = ['jpg','jpeg','png','gif','webp'];
          const isImg = imgExts.includes(ext);

          return {
            id: r.id,
            name: r.file_name || '',
            type: r.file_type || (isImg ? 'image' : ''), // UI hint if backend returned OTHER
            extension: ext,
            size: (typeof r.file_size === 'number' ? r.file_size * 1048576 : 0), // MB -> bytes
            location: r.file_location || '',
            description: r.description || '',
            tags: Array.isArray(r.tags) ? r.tags : [],
            versionCount: r.no_of_versions ?? null,
            createdAt: r.created_at || null,
            modifiedAt: r.modified_at || null,
            resolution: r.resolution || null,

            // 🔑 URLs for preview/thumbnail
            url: webPath,
            thumbnail_url: isImg ? webPath : null,
          };
        });

        applyFilters();
      } catch (err) {
        console.error('❌ Failed to fetch assets:', err);
      }
    }

    // === Initialize ===
    refreshAssets();
  })();
}