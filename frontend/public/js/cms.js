export function initCMS() {
  (function () {
    console.log('✅ Initializing 3D CMS with Advanced Metadata Filters');

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

    // === Styles ===
    injectCSS(`
      body { margin:0; font-family:Inter, sans-serif; background:#0b0e1b; color:#e9ecff; }
      .cms-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 24px; background:#131833; border-bottom:1px solid #22284a; }
      .cms-title { font-size:18px; font-weight:600; color:#a277ff; }
      .btn { padding:8px 18px; border-radius:10px; background:#7aa2ff; color:#fff; border:none; cursor:pointer; font-size:15px; transition:0.2s; }
      .btn:hover { opacity:0.9; }
      .cms-body { padding:28px; display:grid; gap:28px; }
      .cms-upload { border:2px dashed #2c3261; border-radius:14px; padding:26px; text-align:center; color:#a4abdf; }
      .cms-grid { display:grid; gap:22px; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
      .cms-card { background:#171c3f; border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:10px; box-shadow:0 0 10px rgba(0,0,0,0.2); transition:all 0.2s; }
      .cms-card h3 { margin:0; font-size:16px; font-weight:500; }
      .cms-type { font-size:13px; color:#b0b5e0; }
      .cms-tags { display:flex; gap:6px; flex-wrap:wrap; }
      .cms-tag { background:#222856; border-radius:6px; padding:3px 7px; font-size:12px; color:#7aa2ff; }
      .progress { height:6px; border-radius:4px; background:#222856; overflow:hidden; }
      .bar { height:100%; background:#22c55e; width:0%; transition:width 0.2s linear; }

      /* Filters */
      .filter-bar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
      .filter-input { flex:1; padding:8px 12px; border-radius:8px; background:#131833; border:1px solid #2c3261; color:#e9ecff; }
      .filter-select { padding:8px 12px; border-radius:8px; background:#131833; border:1px solid #2c3261; color:#e9ecff; cursor:pointer; }
    `);

    // === DOM structure ===
    const grid = el('div', { class: 'cms-grid', id: 'cmsGrid' });

    const filterBar = el('div', { class: 'filter-bar' }, [
      el('input', {
        class: 'filter-input',
        placeholder: '🔍 Search assets...',
        id: 'filterSearch',
        oninput: applyFilters,
      }),
      el('select', {
        class: 'filter-select',
        id: 'filterType',
        onchange: applyFilters,
      }, [
        el('option', { value: 'all' }, ['All Types']),
        el('option', { value: '3d' }, ['3D Assets']),
        el('option', { value: 'image' }, ['Images']),
        el('option', { value: 'other' }, ['Other Files']),
      ]),
      el('select', {
        class: 'filter-select',
        id: 'filterSize',
        onchange: applyFilters,
      }, [
        el('option', { value: 'all' }, ['All Sizes']),
        el('option', { value: 'small' }, ['Small (<5MB)']),
        el('option', { value: 'medium' }, ['Medium (5–50MB)']),
        el('option', { value: 'large' }, ['Large (>50MB)']),
      ]),
      el('select', {
        class: 'filter-select',
        id: 'filterDate',
        onchange: applyFilters,
      }, [
        el('option', { value: 'all' }, ['All Time']),
        el('option', { value: '24h' }, ['Last 24h']),
        el('option', { value: '7d' }, ['Last 7 Days']),
        el('option', { value: '30d' }, ['Last 30 Days']),
      ]),
    ]);


    const root = el('div', { class: 'cms-root' }, [
      el('div', { class: 'cms-topbar' }, [
        el('div', { class: 'cms-title' }, ['3D CMS']),
        el('button', { class: 'btn', id: 'uploadBtn', onclick: () => { window.location.href = '/upload'; }}, ['Upload']), // ✅ navigates to app/upload/page.js
      ]),
      el('div', { class: 'cms-body' }, [filterBar, grid]),
    ]);

    document.body.innerHTML = '';
    document.body.appendChild(root);



    async function refreshAssets() {
      try {
        const res = await fetch('/api/upload_download/');
        const data = await res.json();
        allAssets = (data.uploaded || []).map(f => ({
          ...f,
          tags: getTagsForFile(f.name),
          uploadedAt: f.uploadedAt ? new Date(f.uploadedAt) : new Date(), // fallback for demo
        }));
        applyFilters();
      } catch (err) {
        console.error('❌ Failed to fetch assets:', err);
      }
    }

    function getTagsForFile(filename) {
      const ext = filename.split('.').pop().toLowerCase();
      if (['glb', 'gltf', 'obj', 'fbx', 'zip'].includes(ext)) return ['3d', 'asset'];
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return ['image'];
      return ['file'];
    }

    function applyFilters() {
      const search = document.getElementById('filterSearch').value.toLowerCase();
      const type = document.getElementById('filterType').value;
      const size = document.getElementById('filterSize').value;
      const date = document.getElementById('filterDate').value;

      const now = new Date();
      const filtered = allAssets.filter(a => {
        const nameMatch = a.name.toLowerCase().includes(search);
        const tagMatch = a.tags?.some(t => t.includes(search));

        // type filter
        const typeMatch =
          type === 'all' ||
          (type === '3d' && a.tags.includes('3d')) ||
          (type === 'image' && a.tags.includes('image')) ||
          (type === 'other' && !a.tags.includes('3d') && !a.tags.includes('image'));

        // size filter
        const sizeMB = a.size / 1048576;
        const sizeMatch =
          size === 'all' ||
          (size === 'small' && sizeMB < 5) ||
          (size === 'medium' && sizeMB >= 5 && sizeMB <= 50) ||
          (size === 'large' && sizeMB > 50);

        // date filter
        const ageHours = (now - new Date(a.uploadedAt)) / (1000 * 60 * 60);
        const dateMatch =
          date === 'all' ||
          (date === '24h' && ageHours <= 24) ||
          (date === '7d' && ageHours <= 168) ||
          (date === '30d' && ageHours <= 720);

        return (nameMatch || tagMatch) && typeMatch && sizeMatch && dateMatch;
      });

      grid.innerHTML = '';
      filtered.forEach(asset => grid.appendChild(createAssetCard(asset)));
    }

    function createAssetCard(data) {
      const cardChildren = [
        el('div', { class: 'cms-type' }, [data.extension || data.type || '']),
        el('h3', null, [data.name]),
        el('div', null, [`${(data.size / 1048576).toFixed(2)} MB`]),
        el('div', { style: 'font-size:12px;color:#8a8fae;' }, [
          data.uploadedAt ? `📅 ${new Date(data.uploadedAt).toLocaleDateString()}` : '',
        ]),
      ];

      if (data.url && data.tags?.includes('image')) {
        cardChildren.push(
          el('img', {
            src: data.url,
            style: { width: '100%', borderRadius: '10px', marginTop: '8px', objectFit: 'cover' },
          })
        );
      }

      cardChildren.push(
        el('div', { class: 'cms-tags' },
          data.tags.map(t => el('div', { class: 'cms-tag' }, [t]))
        ),
        el('div', { style: 'display:flex;gap:10px;margin-top:6px;' }, [
          el('button', { class: 'btn', onclick:() => {window.location.href = '/edit/${asset.id}'} }, ['Edit']),

        ]),
        el('button', { class: 'btn', onclick: () => window.location.href = `/api/upload_download/${asset.id}/download` }, ['Download'])
      );

      return el('div', { class: 'cms-card' }, cardChildren);
    }
// === State and Filtering Logic ===
let allAssets = [];

async function refreshAssets() {
  try {
    // ✅ Built-in demo metadata for testing
    const demoAssets = [
      {
        name: 'Low poly car.glb',
        size: 7.8 * 1048576,
        type: 'GLB',
        extension: 'glb',
        tags: ['3d', 'asset'],
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        url: '/uploads/3d/low-poly-car.glb'
      },
      {
        name: 'Sports Car Red.glb',
        size: 9.4 * 1048576,
        type: 'GLB',
        extension: 'glb',
        tags: ['3d', 'asset'],
        uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        url: '/uploads/3d/sports-car-red.glb'
      },
      {
        name: 'klee 1.jpg',
        size: 0.15 * 1048576,
        type: 'JPG',
        extension: 'jpg',
        tags: ['image'],
        uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        url: '/uploads/image/klee1.jpg'
      },
      {
        name: 'studio_lighting.png',
        size: 12.5 * 1048576,
        type: 'PNG',
        extension: 'png',
        tags: ['image'],
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        url: '/uploads/image/studio-lighting.png'
      },
      {
        name: 'scene_backup.zip',
        size: 78 * 1048576,
        type: 'ZIP',
        extension: 'zip',
        tags: ['3d', 'backup'],
        uploadedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        url: '/uploads/3d/scene_backup.zip'
      },
      {
        name: 'project_docs.pdf',
        size: 2.1 * 1048576,
        type: 'PDF',
        extension: 'pdf',
        tags: ['document'],
        uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        url: '/uploads/files/project_docs.pdf'
      }
    ];

    // You can merge API results + demo data if needed:
    // const res = await fetch('/api/upload_download/');
    // const data = await res.json();
    // allAssets = [...demoAssets, ...(data.uploaded || [])];

    allAssets = demoAssets; // Use only demo data for now
    applyFilters();
  } catch (err) {
    console.error('❌ Failed to fetch assets:', err);
  }
}
    // === Initialize ===
    refreshAssets();
  })();
}
