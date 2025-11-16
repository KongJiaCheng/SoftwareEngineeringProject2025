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

  // Fetch one asset via Next.js proxy route
  useEffect(() => {
    if (!id) return;
    fetch(`/api/asset_preview?id=${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        console.log("Loaded asset from API:", data);

        // normalise tags to something editable
        let tagText = "[]";
        if (Array.isArray(data.tags)) {
          // JSONField as list
          tagText = JSON.stringify(data.tags, null, 2);
        } else if (typeof data.tags === "string") {
          tagText = data.tags;
        } else if (data.tags != null) {
          tagText = JSON.stringify(data.tags, null, 2);
        }

        setAsset({
          id: data.id,
          file_name: data.file_name || "",
          description: data.description || "",
          tags: tagText,
          file_type: data.file_type || "",
          file_size:
            typeof data.file_size === "number" ? data.file_size : 0, // MB
          file_location: data.file_location || "",
          // NOTE: keep whatever DRF sends (usually "HH:MM:SS" or "DD HH:MM:SS")
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

  async function save() {
    if (!asset) return;
    setBusy(true);
    try {
      // --------- TAG PARSING ----------
      let tagsArray = [];
      const raw = (asset.tags || "").trim();

      if (!raw) {
        tagsArray = [];
      } else {
        let parsed = null;
        let parsedAsJson = false;

        // 1) Try JSON.parse
        try {
          parsed = JSON.parse(raw);
          parsedAsJson = true;
        } catch {
          parsedAsJson = false;
        }

        if (parsedAsJson && Array.isArray(parsed)) {
          tagsArray = parsed.map((t) => String(t).trim()).filter(Boolean);
        } else if (parsedAsJson && !Array.isArray(parsed)) {
          alert(
            '❌ Tags JSON must be an array, e.g. ["car","3d","black"].\nCurrently it is a JSON value that is not an array.'
          );
          setBusy(false);
          return;
        } else {
          // 2) Not valid JSON → treat as comma list
          tagsArray = raw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }
      // --------- END TAG PARSING ----------

      const body = {
        file_name: asset.file_name,
        description: asset.description || "",
        tags: tagsArray,                        // <--- final array
        duration: asset.duration || null,       // <--- string or null
        polygon_count:
          asset.polygon_count === "" || asset.polygon_count == null
            ? null
            : Number(asset.polygon_count),
      };

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
      alert("✅ Updated successfully");
      window.location.href = "/main"; // go back to main page
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

  if (loading) return <p style={{ color: "#e5e7eb" }}>Loading...</p>;
  if (!asset) return <p style={{ color: "#f97373" }}>Not found</p>;

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

        <label style={labelStyle}>
          Tags (JSON array or comma list, e.g. ["car","3d"] or car, 3d)
        </label>
        <textarea
          value={asset.tags}
          onChange={(e) => update("tags", e.target.value)}
          style={area}
        />

        <label style={labelStyle}>Current File</label>
        <a
          href={asset.file_location}
          target="_blank"
          rel="noreferrer"
          style={linkStyle}
        >
          {asset.file_location || "(no path)"}
        </a>

        {/* {asset.file_type.startsWith("video") && (
          <>
            <label style={labelStyle}>
              Duration (HH:MM:SS, e.g. 00:00:10 – value from DB)
            </label>
            <input
              value={asset.duration || ""}
              onChange={(e) => update("duration", e.target.value)}
              style={input}
              placeholder="00:00:10"
            />
          </>
        )} */}

        {/* {asset.file_type === "model/glb" ||
        asset.file_name.toLowerCase().endsWith(".glb") ? (
          <>
            <label style={labelStyle}>Polygon Count</label>
            <input
              value={asset.polygon_count}
              onChange={(e) => update("polygon_count", e.target.value)}
              style={input}
            />
          </>
        ) : null} */}

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

// === Styles (dark "ModelVerse" look) ===

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
