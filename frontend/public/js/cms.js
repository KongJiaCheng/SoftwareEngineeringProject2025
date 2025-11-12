// cms.js — keep main code, add modal (preview + details + actions)
export function initCMS() {
  (function () {
    console.log('✅ Initializing 3D CMS with Advanced Metadata Filters + Detail Modal');

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

    // 🆕 Babylon Viewer loader (for GLB/GLTF/FBX/OBJ)
    const ensureBabylonViewer = () => {
      if (document.querySelector('script[data-babylon-viewer]')) return;
      const s = document.createElement('script');
      s.type = 'module';
      s.dataset.babylonViewer = '1';
      s.src = 'https://cdn.jsdelivr.net/npm/@babylonjs/viewer/dist/babylon-viewer.esm.min.js';
      document.head.appendChild(s);
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
      .cms-card { background:#171c3f; border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:10px; box-shadow:0 0 10px rgba(0,0,0,0.2); transition:all 0.2s; cursor:pointer; }
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

      /* 🆕 Modal */
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

    // === DOM structure ===
    const grid = el('div', { class: 'cms-grid', id: 'cmsGrid' });

    const filterBar = el('div', { class: 'filter-bar' }, [
      el('input', {
        class: 'filter-input',
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

      const uploadZone = el('div', { class: 'cms-upload', id: 'uploadZone' }, [
        'Drag & drop files (GLB, OBJ, FBX, ZIP, JPG, PNG) here or click “Upload”',
      ]);

    const root = el('div', { class: 'cms-root' }, [
      el('div', { class: 'cms-topbar' }, [
        el('div', { class: 'cms-title' }, ['3D CMS']),
        el('button', { class: 'btn', id: 'uploadBtn', onclick: () => { window.location.href = '/upload'; }}, ['Upload']), // ✅ navigates to app/upload/page.js
      ]),
      el('div', { class: 'cms-body' }, [filterBar, uploadZone, grid]),
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

    // === Data & Filters ===
    let allAssets = [];

    function getTagsForFile(filename) {
      const ext = (filename.split('.').pop() || '').toLowerCase();
      if (['glb', 'gltf', 'obj', 'fbx', 'zip'].includes(ext)) return ['3d', 'asset'];
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return ['image'];
      return ['file'];
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

        const is3d = (a.tags || []).includes('3d');
        const isImg = (a.tags || []).includes('image');
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

        const ageHours = (now - new Date(a.uploadedAt || now)) / 36e5;
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

      // 保留你原本的卡片按鈕（不影響）
      cardChildren.push(
        el('div', { class: 'cms-tags' },
          (data.tags || []).map(t => el('div', { class: 'cms-tag' }, [t]))
        ),
        el('div', { style: 'display:flex;gap:10px;margin-top:6px;' }, [
          el('button', { class: 'btn', onclick: (e)=>{ e.stopPropagation(); doEdit(data);} }, ['Edit']),
          el('button', { class: 'btn', onclick: (e)=>{ e.stopPropagation(); doDelete(data);} }, ['Delete']),
        ]),
        el('button', { class: 'btn', onclick: (e)=>{ e.stopPropagation(); doDownload(data);} }, ['Download'])
      );

      // 🆕：整張卡片可點 → 彈出 Modal
      return el('div', { class: 'cms-card', onclick: () => openAssetModal(data) }, cardChildren);
    }

    // === Actions (hook up your backend here) ===
    function doDownload(asset) {
      const a = document.createElement('a');
      a.href = asset.download_url || asset.url || '#';
      a.download = asset.name || true;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    async function doDelete(asset) {
      // TODO: 改成你的實際 API（目前只是示範）
      // await fetch(`/api/upload_download?asset=${asset.id}`, { method: 'DELETE' });
      alert(`Delete ${asset.name} (hook your API here)`);
    }

    async function doEdit(asset) {
      // TODO: 依需求彈出編輯表單；目前先示範
      alert(`Edit ${asset.name} (open your form / route here)`);
    }

    // 🆕 Modal：左預覽 + 右側中繼資料 + 操作列（Edit/Delete/Download）
    function openAssetModal(asset) {
      ensureBabylonViewer();

      const ext = (asset.extension || asset.type || '').toString().toLowerCase();
      const is3D = ['glb','gltf','obj','fbx'].includes(ext);
      const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext);

      const modal = el('div', { class:'modal', onclick: (e) => { if (e.target === e.currentTarget) modal.remove(); } });
      const panel = el('div', { class:'panel' });
      const left  = el('div', { class:'left' });
      const right = el('div', { class:'right' });

      if (asset.url && is3D) {
        left.appendChild(el('babylon-viewer', { class:'viewer', source: asset.url, environment:'auto' }));
      } else if (asset.url && isImg) {
        left.appendChild(el('img', { class:'modal-img', src: asset.url, alt: asset.name || '' }));
      } else {
        left.appendChild(el('div', { style:'color:#9fb0ff;font-size:14px' }, ['No preview available for this file type.']));
      }

      right.appendChild(el('h3', null, [asset.name || '(no name)']));

      const meta = el('dl', { class:'meta' });
      const add = (k, v) => { meta.appendChild(el('dt', null, [k])); meta.appendChild(el('dd', null, [v])); };
      add('File Name', asset.name || '—');
      add('File Type', ext || '—');
      add('Size', asset.size ? `${(asset.size/1048576).toFixed(2)} MB` : '—');
      add('Location', '/');
      add('Created', asset.uploadedAt ? new Date(asset.uploadedAt).toLocaleDateString() : '—');
      add('Modified', asset.modifiedAt ? new Date(asset.modifiedAt).toLocaleDateString() : (asset.uploadedAt ? new Date(asset.uploadedAt).toLocaleDateString() : '—'));
      add('Modified By', asset.modifiedBy || 'Me');
      if (asset.polygonCount) add('Polygon Count', String(asset.polygonCount));
      add('No. of Versions', asset.versionCount ? String(asset.versionCount) : (Array.isArray(asset.versions) ? String(asset.versions.length) : '—'));

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

      // 操作列
      const actions = el('div', { class:'row' }, [
        el('button', { class:'btn', onclick: ()=>doEdit(asset) }, ['Edit']),
        el('button', { class:'btn', onclick: ()=>doDelete(asset) }, ['Delete']),
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

    // === Refresh (你可以用 API 或 demo 資料；以下保留你的原設計) ===
    async function refreshAssets() {
      try {
        const demoAssets = [
          { name: 'Low poly car.glb', size: 7.8 * 1048576, type: 'GLB', extension: 'glb', tags: ['3d','asset'], uploadedAt: new Date(Date.now()-2*864e5), url: '/uploads/3d/low-poly-car.glb', id: 101 },
          { name: 'Sports Car Red.glb', size: 9.4 * 1048576, type: 'GLB', extension: 'glb', tags: ['3d','asset'], uploadedAt: new Date(Date.now()-8*864e5), url: '/uploads/3d/sports-car-red.glb', id: 102 },
          { name: 'klee 1.jpg', size: 0.15 * 1048576, type: 'JPG', extension: 'jpg', tags: ['image'], uploadedAt: new Date(Date.now()-1*3600e3), url: '/uploads/image/klee1.jpg', id: 201 },
          { name: 'studio_lighting.png', size: 12.5 * 1048576, type: 'PNG', extension: 'png', tags: ['image'], uploadedAt: new Date(Date.now()-5*864e5), url: '/uploads/image/studio-lighting.png', id: 202 },
          { name: 'scene_backup.zip', size: 78 * 1048576, type: 'ZIP', extension: 'zip', tags: ['3d','backup'], uploadedAt: new Date(Date.now()-25*864e5), url: '/uploads/3d/scene_backup.zip', id: 301 },
          { name: 'project_docs.pdf', size: 2.1 * 1048576, type: 'PDF', extension: 'pdf', tags: ['document'], uploadedAt: new Date(Date.now()-3*3600e3), url: '/uploads/files/project_docs.pdf', id: 401 }
        ];

        // 若要接你原本 API，改成：
        // const res = await fetch('/api/upload_download/');
        // const data = await res.json();
        // allAssets = (data.uploaded || []).map(f => ({ ...f, tags: getTagsForFile(f.name), uploadedAt: f.uploadedAt ? new Date(f.uploadedAt) : new Date() }));

        allAssets = demoAssets;
        applyFilters();
      } catch (err) {
        console.error('❌ Failed to fetch assets:', err);
      }
    }

    // === Initialize ===
    refreshAssets();
  })();
}

