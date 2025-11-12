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
   // === DOM structure ===
const grid = el('div', { class: 'cms-grid', id: 'cmsGrid' });

const filterBar = el('div', { class: 'filter-bar' }, [
  el('input', {
    class: 'filter-input',
    placeholder: '🔍 Search by name, description, or tag...',
    id: 'filterSearch',
    oninput: applyFilters,
  }),
  el('select', {
    class: 'filter-select',
    id: 'filterType',
    onchange: applyFilters,
  }, [
    el('option', { value: 'all' }, ['All File Types']),
    el('option', { value: '3d' }, ['3D Models']),
    el('option', { value: 'image' }, ['Images']),
    el('option', { value: 'video' }, ['Videos']),
    el('option', { value: 'document' }, ['Documents']),
  ]),
  el('select', {
    class: 'filter-select',
    id: 'filterResolution',
    onchange: applyFilters,
  }, [
    el('option', { value: 'all' }, ['All Resolutions']),
    el('option', { value: 'low' }, ['Low (<720p)']),
    el('option', { value: 'medium' }, ['HD (720p–1080p)']),
    el('option', { value: 'high' }, ['Full HD+ (1080p+)']),
  ]),
  el('select', {
    class: 'filter-select',
    id: 'filterPolygon',
    onchange: applyFilters,
  }, [
    el('option', { value: 'all' }, ['All Poly Counts']),
    el('option', { value: 'low' }, ['Low (<10k)']),
    el('option', { value: 'medium' }, ['Medium (10k–100k)']),
    el('option', { value: 'high' }, ['High (>100k)']),
  ]),
  el('select', {
    class: 'filter-select',
    id: 'filterDate',
    onchange: applyFilters,
  }, [
    el('option', { value: 'all' }, ['All Dates']),
    el('option', { value: '24h' }, ['Last 24 Hours']),
    el('option', { value: '7d' }, ['Last 7 Days']),
    el('option', { value: '30d' }, ['Last 30 Days']),
  ]),
]);

const root = el('div', { class: 'cms-root' }, [
  el('div', { class: 'cms-topbar' }, [
    el('div', { class: 'cms-title' }, ['3D CMS']),
    el('button', { class: 'btn', id: 'uploadBtn' }, ['Upload']),
  ]),
  el('div', { class: 'cms-body' }, [filterBar, grid]),
]);

document.body.innerHTML = '';
document.body.appendChild(root);

    // === Upload Handling ===
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);

    document.getElementById('uploadBtn').onclick = () => input.click();
    uploadZone.onclick = () => input.click();

    ['dragover', 'drop'].forEach(evt =>
      uploadZone.addEventListener(evt, e => e.preventDefault())
    );

    uploadZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
    input.addEventListener('change', e => handleFiles(e.target.files));

    function handleFiles(fileList) {
      const files = Array.from(fileList);
      files.forEach(uploadFile);
    }

    async function uploadFile(file) {
      const card = el('div', { class: 'cms-card', id: 'upload-' + file.name }, [
        el('div', { class: 'cms-type' }, [file.name.split('.').pop().toUpperCase()]),
        el('h3', null, [file.name]),
        el('div', null, [(file.size / 1048576).toFixed(2) + ' MB']),
        el('div', { class: 'progress' }, [el('div', { class: 'bar', id: 'bar-' + file.name })]),
      ]);
      grid.appendChild(card);

      const formData = new FormData();
      formData.append('file', file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload_download', true);
      xhr.upload.onprogress = (e) => {
        const percent = (e.loaded / e.total) * 100;
        document.getElementById('bar-' + file.name).style.width = percent + '%';
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          console.log('✅ Uploaded:', file.name);
          refreshAssets();
        } else {
          console.error('❌ Upload failed:', file.name);
        }
      };
      xhr.onerror = () => console.error('❌ Network error for', file.name);
      xhr.send(formData);
    }

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
  const resolution = document.getElementById('filterResolution').value;
  const polygon = document.getElementById('filterPolygon').value;
  const date = document.getElementById('filterDate').value;

  const now = new Date();

  const filtered = allAssets.filter(a => {
    // text search (name, description, tags)
    const nameMatch = a.file_name?.toLowerCase().includes(search);
    const descMatch = a.description?.toLowerCase().includes(search);
    const tagMatch = (a.tags || []).some(t => t.toLowerCase().includes(search));

    // file type filter
    const typeMatch =
      type === 'all' ||
      (type === '3d' && ['glb', 'gltf', 'fbx', 'obj'].includes(a.file_type)) ||
      (type === 'image' && ['jpg', 'jpeg', 'png', 'gif'].includes(a.file_type)) ||
      (type === 'video' && ['mp4', 'mov', 'avi'].includes(a.file_type)) ||
      (type === 'document' && ['pdf', 'docx', 'txt'].includes(a.file_type));

    // resolution filter (if available)
    const resMatch = (() => {
      if (resolution === 'all' || !a.resolution) return true;
      const [w, h] = a.resolution.split('x').map(Number);
      if (!w || !h) return true;
      if (resolution === 'low') return h < 720;
      if (resolution === 'medium') return h >= 720 && h < 1080;
      if (resolution === 'high') return h >= 1080;
      return true;
    })();

    // polygon filter (for 3D models)
    const polyMatch = (() => {
      if (polygon === 'all' || !a.polygon_count) return true;
      if (polygon === 'low') return a.polygon_count < 10000;
      if (polygon === 'medium') return a.polygon_count >= 10000 && a.polygon_count <= 100000;
      if (polygon === 'high') return a.polygon_count > 100000;
      return true;
    })();

    // date filter
    const ageHours = (now - new Date(a.modified_at || a.created_at)) / (1000 * 60 * 60);
    const dateMatch =
      date === 'all' ||
      (date === '24h' && ageHours <= 24) ||
      (date === '7d' && ageHours <= 168) ||
      (date === '30d' && ageHours <= 720);

    return (nameMatch || descMatch || tagMatch) && typeMatch && resMatch && polyMatch && dateMatch;
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
          el('button', { class: 'btn' }, ['Edit']),
          el('button', { class: 'btn' }, ['Delete']),
        ]),
        el('button', { class: 'btn' }, ['Download'])
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
