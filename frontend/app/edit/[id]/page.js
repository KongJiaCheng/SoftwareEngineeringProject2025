"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // --- helpers ---
  const DJANGO = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

  function getCSRFCookie() {
    const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  // Fetch one asset via Next.js proxy route (already exists in your project)
  useEffect(() => {
    if (!id) return;
    fetch(`/api/asset_preview?id=${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        // Map DRF fields → local state
        setAsset({
          id: data.id,
          file_name: data.file_name || "",
          description: data.description || "",
          // tags is array in your backend; join for simple textarea editing
          tags: Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
          file_type: data.file_type || "",
          file_size: typeof data.file_size === "number" ? data.file_size : 0, // MB (per your model)
          file_location: data.file_location || "",
          duration: data.duration || "",
          polygon_count: data.polygon_count ?? "",
          resolution: data.resolution || "",
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  function update(field, value) {
    setAsset((prev) => ({ ...prev, [field]: value }));
  }
/*
  // Save (PATCH) directly to Django endpoint
  async function save() {
    if (!asset) return;
    setBusy(true);
    try {
      const body = {
        file_name: asset.file_name,
        description: asset.description || "",
        // split comma string back to array
        tags: (asset.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        // optional / conditional fields
        duration: asset.duration || null,
        polygon_count: asset.polygon_count === "" ? null : Number(asset.polygon_count),
      };

      const r = await fetch(`${DJANGO}/api/preview/assets/${id}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFCookie(),
        },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error(`Save failed: ${r.status}`);
      alert("✅ Updated successfully");
    } catch (e) {
      alert("❌ Failed to update: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  // Delete
  async function remove() {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    setBusy(true);
    try {
      const r = await fetch(`${DJANGO}/api/preview/assets/${id}/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCSRFCookie() },
      });
      if (r.status !== 204 && r.status !== 200) throw new Error(`Delete failed: ${r.status}`);
      alert("🗑️ Deleted successfully");
      window.location.href = "/main";
    } catch (e) {
      alert("❌ Failed to delete: " + e.message);
    } finally {
      setBusy(false);
    }
  }
*/

    function getCSRFCookie() {
      const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : "";
    }

    async function save() {
      if (!asset) return;
      setBusy(true);
      try {
        const body = {
          file_name: asset.file_name,
          description: asset.description || "",
          tags: (asset.tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          duration: asset.duration || null,
          polygon_count:
            asset.polygon_count === "" || asset.polygon_count == null
              ? null
              : Number(asset.polygon_count),
        };

        const r = await fetch(`/api/asset_edit/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "content-type": "application/json",
            "x-csrftoken": getCSRFCookie(),
          },
          body: JSON.stringify(body),
        });

        if (!r.ok) throw new Error(`Save failed: ${r.status} ${await r.text()}`);
        alert("✅ Updated successfully");
      } catch (e) {
        alert("❌ Failed to update: " + e.message);
      } finally {
        setBusy(false);
      }
    }

    async function remove() {
      if (!confirm("Delete this asset?")) return;
      setBusy(true);
      try {
        const r = await fetch(`/api/asset_edit/${id}`, {
          method: "DELETE",
          credentials: "include",
          headers: { "x-csrftoken": getCSRFCookie() },
        });
        if (r.status !== 204 && r.status !== 200) {
          throw new Error(`Delete failed: ${r.status} ${await r.text()}`);
        }
        alert("🗑️ Deleted successfully");
        window.location.href = "/main";
      } catch (e) {
        alert("❌ Failed to delete: " + e.message);
      } finally {
        setBusy(false);
      }
    }

  if (loading) return <p style={{ color: "#fff" }}>Loading...</p>;
  if (!asset) return <p style={{ color: "red" }}>Not found</p>;

  return (
    <main style={{ maxWidth: 600, margin: "30px auto", color: "#e5e7eb" }}>
      <button
        onClick={() => (window.location.href = "/main")}
        style={{ marginBottom: 20, padding: "8px 14px", background: "#4f46e5", borderRadius: 8 }}
      >
        ← Back
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Edit Asset</h1>

      <label>File Name</label>
      <input
        value={asset.file_name}
        onChange={(e) => update("file_name", e.target.value)}
        style={input}
      />

      <label>Description</label>
      <textarea
        value={asset.description}
        onChange={(e) => update("description", e.target.value)}
        style={area}
      />

      <label>Tags (comma-separated)</label>
      <textarea
        value={asset.tags}
        onChange={(e) => update("tags", e.target.value)}
        style={area}
      />

      <label>Current File</label>
      <a href={asset.file_location} target="_blank" style={{ color: "#60a5fa" }}>
        {asset.file_location || "(no path)"}
      </a>

      {asset.file_type.startsWith("video") && (
        <>
          <label>Duration</label>
          <input
            value={asset.duration || ""}
            onChange={(e) => update("duration", e.target.value)}
            style={input}
          />
        </>
      )}

      {asset.file_type === "model/glb" || asset.file_name.toLowerCase().endsWith(".glb") ? (
        <>
          <label>Polygon Count</label>
          <input
            value={asset.polygon_count}
            onChange={(e) => update("polygon_count", e.target.value)}
            style={input}
          />
        </>
      ) : null}

      <label>File Type</label>
      <input value={asset.file_type} style={input} disabled />
      <label>File Size (MB)</label>
      <input value={asset.file_size} style={input} disabled />

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={save} style={primary} disabled={busy}>Save Changes</button>
        <button onClick={remove} style={danger} disabled={busy}>Delete Asset</button>
      </div>
    </main>
  );
}

// Styles
const input = {
  width: "100%",
  padding: "8px",
  background: "#0b0f15",
  border: "1px solid #30363d",
  borderRadius: 6,
  color: "#e5e7eb",
  marginBottom: 12,
};
const area = { ...input, minHeight: 100 };
const primary = { ...input, background: "#4f46e5", cursor: "pointer" };
const danger = { ...input, background: "#b91c1c", cursor: "pointer", color: "#fff" };
