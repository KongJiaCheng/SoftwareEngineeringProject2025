// public/js/cms.js
export function initCMS() {
  (function () {
    console.log('✅ Initializing Plain-JS 3D CMS');

    // === UTILITIES ===
   const el = (tag, attrs = {}, children = []) => {
  // ✅ guard against null or undefined
  const safeAttrs = attrs || {};
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(safeAttrs)) {
    if (k === 'class') node.className = v;
    else if (k === 'style' && typeof v === 'object')
      Object.assign(node.style, v);
    else if (k.startsWith('on') && typeof v === 'function')
      node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v);
  }

  for (const c of [].concat(children))
    if (c != null)
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);

  return node;
};


    const injectCSS = (css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    };

    // === STYLES (matches screenshot) ===
    injectCSS(`
      :root {
        --bg: #0b0e1b;
        --panel: #131833;
        --card: #171c3f;
        --accent: #7aa2ff;
        --accent2: #a277ff;
        --text: #e9ecff;
        --r: 14px;
      }
      body {
        margin: 0;
        font-family: Inter, system-ui, sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      .cms-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 24px;
        background: var(--panel);
        border-bottom: 1px solid #22284a;
      }
      .cms-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--accent2);
      }
      .cms-btns {
        display: flex;
        gap: 8px;
      }
      .btn {
        padding: 6px 14px;
        border-radius: 10px;
        background: var(--accent);
        color: #fff;
        border: none;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn:hover { opacity: 0.9; }
      .btn.red { background: #e35b5b; }
      .cms-body {
        padding: 24px;
        display: grid;
        gap: 24px;
      }
      .cms-upload {
        border: 2px dashed #2c3261;
        border-radius: var(--r);
        padding: 20px;
        text-align: center;
        color: #a4abdf;
      }
      .cms-search {
        display: flex;
        gap: 10px;
        align-items: center;
        background: #131832;
        padding: 8px 12px;
        border-radius: var(--r);
      }
      .cms-search input {
        flex: 1;
        background: none;
        border: none;
        outline: none;
        color: var(--text);
      }
      .cms-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
      .cms-card {
        background: var(--card);
        border-radius: var(--r);
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
      }
      .cms-card h3 {
        margin: 0;
        font-size: 15px;
      }
      .cms-tags {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .cms-tag {
        background: #222856;
        border-radius: 6px;
        padding: 2px 6px;
        font-size: 12px;
        color: var(--accent);
      }
      .cms-meta {
        margin-top: 16px;
        display: flex;
        gap: 10px;
      }
      .cms-meta input {
        flex: 1;
        border: none;
        background: #12152c;
        color: var(--text);
        padding: 8px 10px;
        border-radius: 10px;
      }
      .cms-meta button {
        background: var(--accent);
        border: none;
        border-radius: 10px;
        padding: 8px 14px;
        color: white;
        cursor: pointer;
      }
    `);

    // === DOM STRUCTURE ===
    const root = el('div', { class: 'cms-root' }, [
      el('div', { class: 'cms-topbar' }, [
        el('div', { class: 'cms-title' }, ['3D CMS — Plain JS']),
        el('div', { class: 'cms-btns' }, [
          el('button', { class: 'btn' }, ['Upload']),
          el('button', { class: 'btn' }, ['Download']),
          el('button', { class: 'btn' }, ['Edit']),
          el('button', { class: 'btn red' }, ['Delete']),
          el('button', { class: 'btn' }, ['Reset']),
        ]),
      ]),
      el('div', { class: 'cms-body' }, [
        el('div', { class: 'cms-search' }, [
          el('input', { type: 'text', placeholder: 'Search title, file name, tags...' }),
        ]),
        el('div', { class: 'cms-upload' }, [
          'Drag & drop GLB/OBJ/FBX/ZIP here or click “Upload” — demo will simulate and add to the grid',
        ]),
        el('div', { class: 'cms-grid', id: 'cmsGrid' }),
        ]),
    ]);

    document.body.innerHTML = ''; // clear React placeholder
    document.body.appendChild(root);

    // === DEMO DATA ===
    const grid = root.querySelector('#cmsGrid');
    const data = [
      {
        name: 'Low poly car',
        size: '7.8 MB',
        file: 'low_poly_car.glb',
        tags: ['3d', 'asset'],
        type: 'GLB',
      },
      {
        name: 'Sports Car Red',
        size: '9.4 MB',
        file: 'sports_red.glb',
        tags: ['car', '3d'],
        type: 'GLB',
      },
    ];

    data.forEach((a) =>
      grid.appendChild(
        el('div', { class: 'cms-card' }, [
          el('div', { class: 'cms-type' }, [a.type]),
          el('h3', null, [a.name]),
          el('div', null, [`${a.size} • ${a.file}`]),
          el('div', { class: 'cms-tags' }, a.tags.map((t) => el('div', { class: 'cms-tag' }, [t]))),
        ])
      )
    );
  })();
}
