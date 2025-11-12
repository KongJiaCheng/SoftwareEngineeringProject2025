export function initCMS() {
  (function () {
    console.log('✅ 3D CMS: type-aware cards + modal preview');

    // ========== Utils ==========
    const el = (tag, attrs = {}, children = []) => {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs || {})) {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
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

    const ensureBabylonViewer = () => {
      if (document.querySelector('script[data-babylon-viewer]')) return;
      const s = document.createElement('script');
      s.type = 'module';
      s.dataset.babylonViewer = '1';
      s.src = 'https://cdn.jsdelivr.net/npm/@babylonjs/viewer/dist/babylon-viewer.esm.min.js';
      document.head.appendChild(s);
    };

    // ========== Styles ==========
    injectCSS(`
      body { margin:0; font-family:Inter, system-ui, sans-serif; background:#0b0e1b; color:#e9ecff; }
      .cms-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 24px; background:#131833; border-bottom:1px solid #22284a; }
      .cms-title { font-size:18px; font-weight:600; color:#a277ff; }
      .btn { padding:8px 18px; border-radius:10px; background:#7aa2ff; color:#fff; border:none; cursor:pointer; font-size:15px; transition:0.2s; }
      .btn:hover { opacity:0.9; }
      .cms-body { padding:28px; display:grid; gap:28px; }
      .cms-grid { display:grid; gap:22px; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); }
      .cms-card { background:#171c3f; border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:10px; box-shadow:0 0 10px rgba(0,0,0,0.2); transition:transform .15s; cursor:pointer; }
      .cms-card:hover { transform: translateY(-2px); }
      .cms-type { font-size:12px; color:#b0b5e0; }
      .cms-tags { display:flex; gap:6px; flex-wrap:wrap; }
      .cms-tag { background:#222856; border-radius:6px; padding:3px 7px; font-size:12px; color:#7aa2ff; }
      .filter-bar { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
      .filter-input,.filter-select { padding:8px 12px; border-radius:8px; background:#131833; border:1px solid #2c3261; color:#e9ecff; }
      .thumb{ width:100%; border-radius:10px; object-fit:cover; aspect-ratio:16/9; background:#0e1330; display:block }

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
    `);

    // ========== Type helpers ==========
    const getExt = (name = '') => (name.split('.').pop() || '').toLowerCase();
    const is3D = (ext) => ['glb','gltf','obj','fbx'].includes(ext);
    const isImage = (ext) => ['jpg','jpeg','png','gif','webp'].includes(ext);

    // ========== DOM ==========
    const grid = el('div', { class: 'cms-grid', id: 'cmsGrid' });
    const filterBar = el('div', { class: 'filter-bar' }, [
      el('input', { class:'filter-input', placeholder:'🔍 Search assets...', id:'filterSearch', oninput: applyFilters }),
      el('select', { class:'filter-select', id:'filterType', onchange: applyFilters }, [
        el('option', { value:'all' }, ['All Types']),
        el('option', { value:'3d' }, ['3D Assets']),
        el('option', { value:'image' }, ['Images']),
        el('option', { value:'other' }, ['Other Files']),
      ]),
      el('select', { class:'filter-select', id:'filterSize', onchange: applyFilters }, [
        el('option', { value:'all' }, ['All Sizes']),
        el('option', { value:'small' }, ['Small (<5MB)']),
        el('option', { value:'medium' }, ['Medium (5–50MB)']),
        el('option', { value:'large' }, ['Large (>50MB)']),
      ]),
      el('select', { class:'filter-select', id:'filterDate', onchange: applyFilters }, [
        el('option', { value:'all' }, ['All Time']),
        el('option', { value:'24h' }, ['Last 24h']),
        el('option', { value:'7d' }, ['Last 7 Days']),
        el('option', { value:'30d' }, ['Last 30 Days']),
      ]),
    ]);

    const root = el('div', { class: 'cms-root' }, [
      el('div', { class: 'cms-topbar' }, [
        el('div', { class: 'cms-title' }, ['3D CMS']),
        el('button', { class: 'btn', id:'uploadBtn', onclick: () => { window.location.href = '/upload'; } }, ['Upload']),
      ]),
      el('div', { class: 'cms-body' }, [filterBar, grid]),
    ]);

    document.body.innerHTML = '';
    document.body.appendChild(root);

    // ========== Data ==========
    let allAssets = [];

    async function refreshAssets() {
      try {
        const res = await fetch('/api/upload_download/');
        const data = await res.json();
        allAssets = (data.uploaded || []).map(f => ({
          ...f,
          extension: (f.extension || getExt(f.name)),
          tags: getTagsForFile(f.name),
          uploadedAt: f.uploadedAt ? new Date(f.uploadedAt) : new Date(),
        }));
        applyFilters();
      } catch (err) {
        console.error('❌ Failed to fetch assets:', err);
      }
    }

    function getTagsForFile(filename) {
      const ext = getExt(filename);
      if (['glb','gltf','obj','fbx','zip'].includes(ext)) return ['3d','asset'];
      if (['jpg','jpeg','png','gif','webp'].includes(ext)) return ['image'];
      return ['file'];
    }

    // ========== Filters ==========
    function applyFilters() {
      const search = (document.getElementById('filterSearch').value || '').toLowerCase();
      const type = document.getElementById('filterType').value;
      const size = document.getElementById('filterSize').value;
      const date = document.getElementById('filterDate').value;

      const now = new Date();
      const filtered = allAssets.filter(a => {
        const nameMatch = (a.name || '').toLowerCase().includes(search);
        const tagMatch = (a.tags || []).some(t => (t || '').toLowerCase().includes(search));

        const ext = a.extension || getExt(a.name);
        const typeMatch = type === 'all' ||
          (type === '3d' && is3D(ext)) ||
          (type === 'image' && isImage(ext)) ||
          (type === 'other' && !is3D(ext) && !isImage(ext));

        const sizeMB = (a.size || 0) / 1048576;
        const sizeMatch = size === 'all' ||
          (size === 'small' && sizeMB < 5) ||
          (size === 'medium' && sizeMB >= 5 && sizeMB <= 50) ||
          (size === 'large' && sizeMB > 50);

        const ageHours = (now - new Date(a.uploadedAt || now)) / 36e5;
        const dateMatch = date === 'all' ||
          (date === '24h' && ageHours <= 24) ||
          (date === '7d' && ageHours <= 168) ||
          (date === '30d' && ageHours <= 720);

        return (nameMatch || tagMatch) && typeMatch && sizeMatch && dateMatch;
      });

      grid.innerHTML = '';
      filtered.forEach(asset => grid.appendChild(createAssetCard(asset)));
    }

    // ========== Cards (type-aware) ==========
    function createAssetCard(asset) {
      const ext = asset.extension || getExt(asset.name);
      const typeLabel = is3D(ext) ? '3D' : isImage(ext) ? 'Image' : (ext || 'File').toUpperCase();

      const card = el('div', { class:'cms-card', onclick: () => openAssetModal(asset) }, [
        el('div', { class:'cms-type' }, [typeLabel]),
        el('h3', null, [asset.name || '(no name)']),
      ]);

      // 依型別顯示必要資訊
      if (isImage(ext) && asset.url) {
        card.appendChild(el('img', { class:'thumb', src: asset.url, alt: asset.name }));
      } else if (is3D(ext)) {
        card.appendChild(el('div', { class:'thumb', style:'display:flex;align-items:center;justify-content:center;font-size:12px;color:#8aa0ff;' }, ['3D Preview']));
      } else {
        const mb = asset.size ? (asset.size/1048576).toFixed(2) : '—';
        card.appendChild(el('div', { class:'cms-type' }, [`.${ext} • ${mb} MB`]));
      }

      if (Array.isArray(asset.tags) && asset.tags.length) {
        card.appendChild(el('div', { class:'cms-tags' }, asset.tags.map(t => el('div', { class:'cms-tag' }, [t]))));
      }
      return card;
    }

    // ========== Modal ==========
    function openAssetModal(asset) {
      ensureBabylonViewer();
      const ext = asset.extension || getExt(asset.name);

      const modal = el('div', { class:'modal', onclick: (e) => { if (e.target === e.currentTarget) modal.remove(); } });
      const panel = el('div', { class:'panel' });
      const left  = el('div', { class:'left' });
      const right = el('div', { class:'right' });

      // 左側預覽（依型別）
      if (is3D(ext) && asset.url) {
        left.appendChild(el('babylon-viewer', { class:'viewer', source: asset.url, environment:'auto' }));
      } else if (isImage(ext) && asset.url) {
        left.appendChild(el('img', { class:'modal-img', src: asset.url, alt: asset.name }));
      } else {
        left.appendChild(el('div', { style:'color:#9fb0ff;font-size:14px' }, ['No preview available for this file type.']));
      }

      // 右側中繼資料
      right.appendChild(el('h3', null, [asset.name || '(no name)']));
      const meta = el('dl', { class:'meta' });
      const add = (k, v) => { meta.appendChild(el('dt', null, [k])); meta.appendChild(el('dd', null, [v])); };
      add('Type', (ext || '').toUpperCase());
      add('Size', asset.size ? `${(asset.size/1048576).toFixed(2)} MB` : '—');
      add('Uploaded', asset.uploadedAt ? new Date(asset.uploadedAt).toLocaleString() : '—');
      add('Tags', (asset.tags || []).join(', ') || '—');
      if (asset.id) add('Asset ID', String(asset.id));
      right.appendChild(meta);

      // 操作按鈕（下載）
      right.appendChild(el('div', { style:'display:flex; gap:10px; margin-top:10px;' }, [
        el('a', { class:'btn', href: asset.download_url || asset.url || '#', download: asset.name || true }, ['Download']),
        el('button', { class:'btn', onclick: () => modal.remove() }, ['Close'])
      ]));

      panel.appendChild(left);
      panel.appendChild(right);
      panel.appendChild(el('button', { class:'close', onclick: () => modal.remove() }, ['✕']));
      modal.appendChild(panel);
      document.body.appendChild(modal);
    }

    // ========== Init ==========
    refreshAssets();
  })();
}
