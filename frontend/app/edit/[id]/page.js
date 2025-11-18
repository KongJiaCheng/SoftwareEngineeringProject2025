"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function getCSRFCookie() {
    const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  // ---- helper: normalise tags from API into array of strings ----
  function normaliseTags(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw.map((t) => String(t)).filter(Boolean);
    }
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (!trimmed) return [];
      // try JSON array first
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((t) => String(t)).filter(Boolean);
        }
      } catch {
        // ignore JSON error, fall back to comma list
      }
      // fallback: comma / newline separated
      return trimmed
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }
    // anything else: stringify & split by commas
    return String(raw)
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Fetch one asset via Next.js proxy route
  useEffect(() => {
    if (!id) return;
    fetch(`/api/asset_preview?id=${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        console.log("Loaded asset from API:", data);

        const tagsArray = normaliseTags(data.tags);

        setAsset({
          id: data.id,
          file_name: data.file_name || "",
          description: data.description || "",
          tags: tagsArray,         // <--- array of strings
          tagInput: "",            // <--- buffer for input box
          file_type: data.file_type || "",
          file_size:
            typeof data.file_size === "number" ? data.file_size : 0, // MB
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

  // ---- TAG HANDLERS (same behaviour as upload page) ----
  function handleTagInputChange(e) {
    update("tagInput", e.target.value);
  }

  function handleAddTag() {
    if (!asset) return;
    const newTag = (asset.tagInput || "").trim();
    if (!newTag) return;

    setAsset((prev) => {
      const currentTags = (prev.tags || []).map((t) => String(t));
      if (currentTags.includes(newTag)) {
        // no duplicates; just clear input
        return { ...prev, tagInput: "" };
      }
      return {
        ...prev,
        tags: [...currentTags, newTag],
        tagInput: "",
      };
    });
  }

  function handleRemoveTag(tag, idx) {
    setAsset((prev) => {
      const currentTags = (prev.tags || []).map((t) => String(t));
      const nextTags = currentTags.filter(
        (tVal, i) => !(tVal === tag && i === idx)
      );
      return { ...prev, tags: nextTags };
    });
  }

  async function save() {
    if (!asset) return;
    setBusy(true);
    try {
      const tagsArray = (asset.tags || [])
        .map((t) => String(t).trim())
        .filter(Boolean);

      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const userId = user.id || null;

      const body = {
        file_name: asset.file_name,
        description: asset.description || "",
        tags: tagsArray,
        duration: asset.duration || null,
        polygon_count:
          asset.polygon_count === "" || asset.polygon_count == null
            ? null
            : Number(asset.polygon_count),
      };


      if (userId) {
        body.modified_by = userId;
      }

      console.log("PATCH body being sent:", body);

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
      window.location.href = "/main";
    } catch (e) {
      alert("❌ Failed to update: " + e.message);
    } finally {
      setBusy(false);
    }
  }


  async function remove() {
    if (!confirm("Delete this asset?")) return;

    fetch(`/api/asset_edit/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-csrftoken": getCSRFCookie(),
      },
      body: JSON.stringify({ _delete: true }),
    }).catch(() => {});

    setTimeout(() => {
      window.location.href = "/main";
    }, 200);
  }

  if (loading) return <p style={{ color: "#e5e7eb" }}>Loading...</p>;
  if (!asset) return <p style={{ color: "#f97373" }}>Not found</p>;

  const tagsArray = asset.tags || [];

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <button
          onClick={() => (window.location.href = "/main")}
          style={backButton}
        >
          ← Back
        </button>

        <h1 style={titleStyle}>Edit Asset</h1>
        <p style={subtitleStyle}>
          Update metadata for your asset. Changes are saved to the ModelVerse
          backend.
        </p>

        <label style={labelStyle}>File Name</label>
        <input
          value={asset.file_name}
          onChange={(e) => update("file_name", e.target.value)}
          style={input}
        />

        <label style={labelStyle}>Description</label>
        <textarea
          value={asset.description}
          onChange={(e) => update("description", e.target.value)}
          style={area}
        />

        {/* TAG UI (similar to upload page) */}
        <label style={labelStyle}>Tags</label>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <input
            value={asset.tagInput || ""}
            onChange={handleTagInputChange}
            style={{ ...input, marginBottom: 0 }}
            placeholder="Type a tag and click Add"
          />
          <button
            type="button"
            onClick={handleAddTag}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #30363d",
              background: "#111827",
              color: "#e5e7eb",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Add
          </button>
        </div>

        {tagsArray.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {tagsArray.map((tag, idx) => (
              <span
                key={tag + idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 9999,
                  border: "1px solid #4b5563",
                  background: "#111827",
                  color: "#ffffff",
                  fontSize: 12,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag, idx)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#fca5a5",
                    cursor: "pointer",
                    fontSize: 12,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div
            style={{
              fontSize: 12,
              color: "#9ca3af",
              marginBottom: 16,
            }}
          >
            No tags yet. Add one above.
          </div>
        )}

        <label style={labelStyle}>Current File</label>
        <a
          href={asset.file_location}
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
        >
          {asset.file_location || "(no path)"}
        </a>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>File Type</label>
            <input value={asset.file_type} style={inputDisabled} disabled />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>File Size (MB)</label>
            <input value={asset.file_size} style={inputDisabled} disabled />
          </div>
        </div>

        <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
          <button onClick={save} style={primary} disabled={busy}>
            {busy ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={remove} style={danger} disabled={busy}>
            Delete Asset
          </button>
        </div>
      </section>
    </main>
  );
}

// === Styles (same as your current file) ===

const pageStyle = {
  minHeight: "100vh",
  padding: "40px 24px",
  background:
    "radial-gradient(circle at top, #1d2b64 0, #020617 45%, #000000 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const cardStyle = {
  width: "100%",
  maxWidth: 720,
  background: "rgba(15,23,42,0.96)",
  borderRadius: 18,
  padding: 32,
  boxShadow: "0 24px 80px rgba(15,23,42,0.9)",
  border: "1px solid #1f2937",
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 700,
  color: "#e5e7eb",
  marginBottom: 4,
};

const subtitleStyle = {
  fontSize: 14,
  color: "#9ca3af",
  marginBottom: 24,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: "#9ca3af",
  marginBottom: 6,
  marginTop: 4,
};

const linkStyle = {
  display: "inline-block",
  marginBottom: 16,
  color: "#60a5fa",
  fontSize: 14,
};

const backButton = {
  marginBottom: 18,
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid #4f46e5",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: 13,
  cursor: "pointer",
};

const baseInput = {
  width: "100%",
  padding: "10px 12px",
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 10,
  color: "#e5e7eb",
  outline: "none",
  fontSize: 14,
  marginBottom: 14,
};

const input = baseInput;

const inputDisabled = {
  ...baseInput,
  opacity: 0.7,
  cursor: "not-allowed",
};

const area = { ...baseInput, minHeight: 96, resize: "vertical" };

const primary = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #38bdf8 100%)",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

const danger = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background:
    "linear-gradient(135deg, #b91c1c 0%, #ef4444 40%, #f97373 100%)",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};
