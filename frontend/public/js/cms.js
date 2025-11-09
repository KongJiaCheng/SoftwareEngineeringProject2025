export function initCMS() {
  (function () {
    console.log('✅ Initializing 3D CMS with Fixed Upload Logic');

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
    `);

    // === DOM structure ===
    const grid = el('div', { class: 'cms-grid', id: 'cmsGrid' });
    const uploadZone = el('div', { class: 'cms-upload', id: 'uploadZone' }, [
      'Drag & drop files (GLB, OBJ, FBX, ZIP, JPG, PNG) here or click “Upload”'
    ]);

    const root = el('div', { class: 'cms-root' }, [
      el('div', { class: 'cms-topbar' }, [
        el('div', { class: 'cms-title' }, ['3D CMS']),
        el('button', { class: 'btn', id: 'uploadBtn' }, ['Upload'])
      ]),
      el('div', { class: 'cms-body' }, [uploadZone, grid])
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
        el('div', { class: 'progress' }, [el('div', { class: 'bar', id: 'bar-' + file.name })])
      ]);
      grid.appendChild(card);

      const ext = file.name.split('.').pop().toLowerCase();
      const is3D = ['glb', 'gltf', 'obj', 'fbx', 'zip'].includes(ext);
      const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);

      const endpoint = is3D
        ? '/api/upload_3d/'
        : isImage
          ? '/api/upload_image/'
          : null;

      const bar = document.getElementById('bar-' + file.name);

      if (!endpoint) {
        if (bar) {
          bar.style.background = '#e35b5b';
          bar.style.width = '100%';
        }
        console.warn('⚠️ Unsupported file type:', ext);
        return;
      }

     const form = new FormData();
form.append('file', file, file.name);

const xhr = new XMLHttpRequest();
xhr.open('POST', '/api/upload_download', true);
xhr.upload.onprogress = (e) => {
  if (e.lengthComputable) {
    const percent = (e.loaded / e.total) * 100;
    console.log(`Uploading: ${percent.toFixed(2)}%`);
  }
};
xhr.onload = () => {
  const res = JSON.parse(xhr.responseText);
  if (xhr.status === 200) console.log('✅ Uploaded:', res);
  else console.error('❌ Error:', res.error);
};
xhr.send(formData);
      xhr.onerror = () => {
        if (bar) bar.style.background = '#e35b5b';
        console.error('❌ Upload network error for', file.name);
      };

      xhr.send(form);
    }

    // === Asset Card ===
    function createAssetCard(data) {
      const ext = data.name.split('.').pop().toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(ext);
      const is3D = ['glb', 'gltf', 'obj', 'fbx', 'zip'].includes(ext);

      const cardChildren = [
        el('div', { class: 'cms-type' }, [data.type]),
        el('h3', null, [data.name]),
        el('div', null, [data.size]),
      ];

      if (isImage && data.url) {
        cardChildren.push(
          el('img', {
            src: data.url,
            style: {
              width: '100%',
              borderRadius: '10px',
              marginTop: '8px',
              objectFit: 'cover'
            }
          })
        );
      }

      const tags = is3D
        ? ['3d', 'asset']
        : isImage
          ? ['image']
          : ['file'];

      cardChildren.push(
        el('div', { class: 'cms-tags' },
          tags.map(t => el('div', { class: 'cms-tag' }, [t]))
        )
      );

      cardChildren.push(
        el('div', { style: 'display:flex;gap:10px;margin-top:6px;' }, [
          el('button', { class: 'btn' }, ['Edit']),
          el('button', { class: 'btn' }, ['Delete'])
        ]),
        el('button', { class: 'btn' }, ['Download'])
      );

      return el('div', { class: 'cms-card' }, cardChildren);
    }

    // === Demo assets ===
    const demo = [
      { name: 'Low poly car.glb', size: '7.8 MB', type: 'GLB', tags: ['3d', 'asset'] },
      { name: 'Sports Car Red.glb', size: '9.4 MB', type: 'GLB', tags: ['car', '3d'] },
    ];

    demo.forEach(asset => grid.appendChild(createAssetCard(asset)));
  })();
}
