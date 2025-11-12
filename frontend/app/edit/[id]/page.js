"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EditPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  
  //Fetch asset
  useEffect(() => {
    fetch(`/assets/api/${id}/`)
      .then((r) => r.json())
      .then((data) => {
        setAsset(data);
        setLoading(false);
      });
  }, [id]);

  /*

  // Fake fetch asset for demo purposes
  useEffect(() => {
    const fakeAsset = {
      id: id,
      asset_name: "Test Asset",
      file_type: "video/mp4", // or "image/png", "model/glb"
      file_location: "/media/upload_download/test.mp4",
      file_size: "12 MB",
      description: "This is a sample description.",
      tags: "sample, testing",
      duration: "00:01:23", // only for videos
      polygon_count: 1024,  // only for glb files
    };
    setAsset(fakeAsset);
    setLoading(false);
  }, [id]);
  */

///////////////////////
  function update(field, value) {
    setAsset((prev) => ({ ...prev, [field]: value }));
  }

  // Save changes
  function save() {
    const form = new FormData();
    form.append("asset_name", asset.asset_name);
    form.append("description", asset.description || "");
    form.append("tags", asset.tags || "");
    form.append("duration", asset.duration || "");
    form.append("polygon_count", asset.polygon_count || "");
    form.append("file_type", asset.file_type);
    form.append("file_size", asset.file_size);

    fetch(`/assets/edit/${id}/save/`, { method: "POST", body: form })
      .then(() => alert("✅ Updated successfully"))
      .catch(() => alert("❌ Failed to update"));
  }

  // Delete asset
  function remove() {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    fetch(`/assets/delete/${id}/`, { method: "POST" })
      .then(() => {
        alert("🗑️ Deleted successfully");
        window.location.href = "/main";
      })
      .catch(() => alert("❌ Failed to delete"));
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
        value={asset.asset_name}
        onChange={(e) => update("asset_name", e.target.value)}
        style={input}
      />

      <label>Description</label>
      <textarea
        value={asset.description || ""}
        onChange={(e) => update("description", e.target.value)}
        style={area}
      />

      <label>Tags</label>
      <textarea
        value={asset.tags || ""}
        onChange={(e) => update("tags", e.target.value)}
        style={area}
      />

      <label>Current File</label>
      <a href={asset.file_location} target="_blank" style={{ color: "#60a5fa" }}>
        {asset.file_location}
      </a>
//////////////////////////
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

      {asset.file_type === "model/glb" && (
        <>
          <label>Polygon Count</label>
          <input
            value={asset.polygon_count || ""}
            onChange={(e) => update("polygon_count", e.target.value)}
            style={input}
          />
        </>
      )}

      <label>File Type</label>
      <input value={asset.file_type} style={input} disabled />
      <label>File Size</label>
      <input value={asset.file_size} style={input} disabled />

        

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <button onClick={save} style={primary}>Save Changes</button>
        <button onClick={remove} style={danger}>Delete Asset</button>
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