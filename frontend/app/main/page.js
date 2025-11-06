"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// A simple storefront-like main page matching your prototype
// - Left filter sidebar (keywords chips, checkboxes, price range)
// - Top bar with Sign in / Register
// - Search + toolbar chips + sort buttons
// - Card grid (image placeholder, title, price $0)
// - Footer with 3 columns and social icons
// TailwindCSS required.

export default function MainPage() {
  const router = useRouter();

  // --- Auth (optional: we don't force redirect to show the landing UI) ---
  const [user, setUser] = useState(null);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  // --- UI State ---
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState({
    keywords: ["Spring", "Smart", "Modern"],
    checks: { a: true, b: true, c: true },
    price: 100,
    colors: { black: true, gray: true, white: true },
    sizes: { s: true, m: true, l: true },
  });
  const [sort, setSort] = useState("new"); // new | priceAsc | priceDesc | rating

  // --- Mock items (replace with API later) ---
  const items = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: String(i+1),
    title: "Text",
    price: 0,
    rating: 4 + ((i % 5) * 0.1),
    createdAt: Date.now() - i * 86400000,
  })), []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = items.filter(it => (term ? it.title.toLowerCase().includes(term) : true));
    switch (sort) {
      case "priceAsc": list = [...list].sort((a,b)=>a.price-b.price); break;
      case "priceDesc": list = [...list].sort((a,b)=>b.price-a.price); break;
      case "rating": list = [...list].sort((a,b)=>b.rating-a.rating); break;
      default: list = [...list].sort((a,b)=>b.createdAt-a.createdAt); break; // new
    }
    return list;
  }, [items, search, sort]);

  // --- Helpers ---
  function Chip({ label, onRemove }) {
    return (
      <span className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm mr-2 mb-2">
        {label}
        {onRemove && (
          <button onClick={onRemove} className="hover:text-red-600">×</button>
        )}
      </span>
    );
  }

  function PlaceholderImage() {
    return (
      <div className="w-full aspect-[4/3] rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
        {/* simple placeholder glyph */}
        <div className="w-16 h-16 rounded bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-black" />
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-gray-600">Hi, {user.username}</span>
                <button
                  onClick={() => { localStorage.removeItem("user"); setUser(null); }}
                  className="px-3 py-1.5 rounded border hover:bg-gray-50"
                >Sign out</button>
              </>
            ) : (
              <>
                <button onClick={()=>router.push("/login")}
                        className="px-3 py-1.5 rounded border hover:bg-gray-50">Sign in</button>
                <button onClick={()=>router.push("/register")}
                        className="px-3 py-1.5 rounded bg-black text-white hover:bg-gray-800">Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="col-span-12 md:col-span-3 lg:col-span-3 border rounded-lg p-4 h-fit">
          <h3 className="font-semibold mb-3">Keywords</h3>
          <div className="mb-4">
            <div className="flex flex-wrap">
              {selected.keywords.map((k, idx) => (
                <Chip key={k+idx} label={k} onRemove={() => {
                  setSelected(s => ({ ...s, keywords: s.keywords.filter(x => x!==k) }));
                }} />
              ))}
            </div>
          </div>

          {([1,2,3]).map((n) => (
            <div key={n} className="mb-4">
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" defaultChecked />
                <div>
                  <div className="font-medium">Label</div>
                  <div className="text-sm text-gray-500">Description</div>
                </div>
              </label>
            </div>
          ))}

          {/* Price range */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Label</span><span>$0–100</span>
            </div>
            <input type="range" min="0" max="100" value={selected.price}
                   onChange={(e)=> setSelected(s=>({...s, price: Number(e.target.value)}))}
                   className="w-full" />
          </div>

          {/* Color */}
          <div className="mb-4">
            <div className="font-semibold mb-2">Color</div>
            {Object.entries(selected.colors).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={v} onChange={()=>setSelected(s=>({ ...s, colors: { ...s.colors, [k]: !s.colors[k] } }))} />
                <span className="text-sm capitalize">{k}</span>
              </label>
            ))}
          </div>

          {/* Size */}
          <div className="mb-2">
            <div className="font-semibold mb-2">Size</div>
            {Object.entries(selected.sizes).map(([k, v]) => (
              <label key={k} className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={v} onChange={()=>setSelected(s=>({ ...s, sizes: { ...s.sizes, [k]: !s.sizes[k] } }))} />
                <span className="text-sm uppercase">{k}</span>
              </label>
            ))}
          </div>
        </aside>

        {/* Main grid */}
        <section className="col-span-12 md:col-span-9 lg:col-span-9">
          {/* Search + toolbar */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full border rounded-lg px-3 py-2 pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              </div>
              <button className="p-2 border rounded-lg" title="Download">⬇️</button>
              <button className="p-2 border rounded-lg" title="Home">🏠</button>
              <button className="p-2 border rounded-lg" title="Magic">✨</button>
              <button
                onClick={()=>setSort("new")}
                className={`px-2 py-1 rounded-lg border ${sort==="new"?"bg-black text-white":""}`}
              >New</button>
              <button onClick={()=>setSort("priceAsc")} className="px-2 py-1 rounded-lg border">Price ascending</button>
              <button onClick={()=>setSort("priceDesc")} className="px-2 py-1 rounded-lg border">Price descending</button>
              <button onClick={()=>setSort("rating")} className="px-2 py-1 rounded-lg border">Rating</button>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it) => (
              <div key={it.id} className="border rounded-lg p-3">
                <PlaceholderImage />
                <div className="mt-3">
                  <div className="text-sm">{it.title}</div>
                  <div className="font-semibold">${it.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8">
        <div className="mx-auto max-w-7xl px-4 py-10 grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-3 flex flex-col gap-4">
            <div className="w-8 h-8 bg-black rounded" />
            <div className="flex items-center gap-3 text-2xl">
              <span>𝕏</span><span>◎</span><span>▶️</span><span>in</span>
            </div>
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="font-semibold mb-3">Use cases</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>UI design</li>
              <li>UX design</li>
              <li>Wireframing</li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="font-semibold mb-3">Explore</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Design</li>
              <li>Prototyping</li>
              <li>Development features</li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-3">
            <div className="font-semibold mb-3">Resources</div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Blog</li>
              <li>Best practices</li>
              <li>Colors</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
