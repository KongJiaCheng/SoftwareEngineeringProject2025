"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export default function UploadPage() {
  const h = React.createElement;

  // ---------- State ----------
  const [files, setFiles] = useState([]);               // File objects chosen (not yet saved)
  const [error, setError] = useState("");
  const [progressMap, setProgressMap] = useState({});   // filename -> %
  const [localEdits, setLocalEdits] = useState({});     // filename -> editable metadata
  const [saveBusy, setSaveBusy] = useState({});         // filename -> boolean
  const [saveOK, setSaveOK] = useState({});             // filename -> true
  const [predictedInfo, setPredictedInfo] = useState({}); // { "original.ext": { rel, url } } (shown immediately)
  const [savedInfo, setSavedInfo] = useState({});         // { "original.ext": serverRow } (shown after save)

  // Client-probed metadata by ORIGINAL filename (before save)
  const [vidDur, setVidDur] = useState({});             // { "name.mp4": seconds }
  const [resProbe, setResProbe] = useState({});         // { "name.jpg": "1920x1080" }

  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // ---------- Helpers ----------
  function updateProgress(filename, pct) {
    setProgressMap((prev) => ({ ...prev, [filename]: pct }));
  }

  function humanSize(n) {
    if (!Number.isFinite(n)) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(1) + " MB";
  }

  const isImage = (t = "") => String(t).startsWith("image/");
  const isVideo = (t = "") => String(t).startsWith("video/");
  const isGLB = (rowOrType) => {
    if (typeof rowOrType === "string") {
      const t = rowOrType.toLowerCase();
      return t.includes("gltf") || t.includes("glb");
    }
    const n = (rowOrType.file_name || "").toLowerCase();
    const t = (rowOrType.file_type || "").toLowerCase();
    return n.endsWith(".glb") || t.includes("gltf") || (t.includes("octet-stream") && n.endsWith(".glb"));
  };

  // Build default edit object from a file + client probes
  const primedFrom = (f) => {
    const type = String(f.type || "").toLowerCase();
    return {
      file_name: f.name,
      file_type: type,
      file_size: f.size,
      description: "",
      tags: "[]",
      resolution: resProbe[f.name] || "",   // auto (read-only)
      duration: vidDur[f.name] || "",       // auto for videos (read-only)
      polygon_count: "",                    // GLB optional (editable)
    };
  };

  /** Predict save path immediately on pick/drop (mirrors backend date folders). */
  function predictForPickedFiles(fileList) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dir = `uploads/${yyyy}/${mm}/${dd}`; // adjust if your backend folder differs

    function slugifyBase(name) {
      return name
        .toLowerCase()
        .replace(/\.[^.]+$/, "")      // drop extension
        .replace(/[^a-z0-9]+/g, "-")  // non-alnum -> hyphen
        .replace(/^-+|-+$/g, "")      // trim hyphens
        .slice(0, 48) || "file";
    }

    function shortId(n = 7) {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let out = "";
      for (let i = 0; i < n; i++) out += chars[(Math.random() * chars.length) | 0];
      return out;
    }

    const next = {};
    Array.from(fileList).forEach((f) => {
      const ext = (f.name.includes(".") ? f.name.split(".").pop() : "").toLowerCase();
      const base = slugifyBase(f.name);
      const finalName = ext ? `${base}_${shortId()}.${ext}` : `${base}_${shortId()}`;
      const rel = `${dir}/${finalName}`;
      next[f.name] = { rel, url: `/media/${rel}` }; // change /media if your MEDIA_URL differs
    });

    setPredictedInfo((prev) => ({ ...prev, ...next }));
  }

  /** Probe local media metadata (duration & resolution) before save */
  function probeMediaMeta(fileList) {
    fileList.forEach((f) => {
      const type = String(f.type || "");
      const url = URL.createObjectURL(f);

      // Images -> resolution via <img>
      if (type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          if (w && h) {
            setResProbe((prev) => ({ ...prev, [f.name]: `${Math.round(w)}x${Math.round(h)}` }));
          }
          URL.revokeObjectURL(url);
        };
        img.onerror = () => URL.revokeObjectURL(url);
        img.src = url;
        return;
      }

      // Videos -> duration + resolution via <video>
      if (type.startsWith("video/")) {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.src = url;
        v.onloadedmetadata = () => {
          const secs = Math.round(v.duration);
          if (Number.isFinite(secs) && secs > 0) {
            setVidDur((prev) => ({ ...prev, [f.name]: secs }));
          }
          const vw = v.videoWidth || 0;
          const vh = v.videoHeight || 0;
          if (vw && vh) {
            setResProbe((prev) => ({ ...prev, [f.name]: `${vw}x${vh}` }));
          }
          URL.revokeObjectURL(url);
        };
        v.onerror = () => URL.revokeObjectURL(url);
        return;
      }

      // Other types: no auto-probe; we'll fall back to blank
      URL.revokeObjectURL(url);
    });
  }

  // ---------- Pick & DnD ----------
  const onPick = useCallback((e) => {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;

    // reset UI state
    setError("");
    setProgressMap({});
    setSaveBusy({});
    setSaveOK({});
    setPredictedInfo({});
    setSavedInfo({});

    // store files, predict, and probe
    setFiles(list);
    predictForPickedFiles(list);
    probeMediaMeta(list);

    // init local edits
    const init = {};
    list.forEach((f) => (init[f.name] = primedFrom(f)));
    setLocalEdits(init);
  }, [resProbe, vidDur]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const list = Array.from(e.dataTransfer?.files || []);
    if (!list.length) return;

    // reset UI state
    setError("");
    setProgressMap({});
    setSaveBusy({});
    setSaveOK({});
    setPredictedInfo({});
    setSavedInfo({});

    // store files, predict, and probe
    setFiles(list);
    predictForPickedFiles(list);
    probeMediaMeta(list);

    // init local edits
    const init = {};
    list.forEach((f) => (init[f.name] = primedFrom(f)));
    setLocalEdits(init);
  }, [resProbe, vidDur]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const node = dropRef.current;
    if (!node) return;
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("drop", onDrop);
    return () => {
      node.removeEventListener("dragover", onDragOver);
      node.removeEventListener("drop", onDrop);
    };
  }, [onDragOver, onDrop]);

  // Keep localEdits in sync when async probes finish
  useEffect(() => {
    if (!files.length) return;
    setLocalEdits((prev) => {
      const next = { ...prev };
      files.forEach((f) => {
        const name = f.name;
        const cur = next[name] || {};
        // If resolution empty but probe arrived, set it
        if ((!cur.resolution || String(cur.resolution).trim() === "") && resProbe[name]) {
          next[name] = { ...cur, resolution: resProbe[name] };
        }
        // If duration empty but video probe arrived, set it
        if ((!cur.duration || String(cur.duration).trim() === "") && vidDur[name]) {
          next[name] = { ...(next[name] || cur), duration: vidDur[name] };
        }
      });
      return next;
    });
  }, [resProbe, vidDur, files]);

  // ---------- Per-file Save ----------
  async function saveOneNew(file) {
    const key = file.name;
    const meta = localEdits[key] || {};

    // Require a file name
    const finalName = (meta.file_name || "").trim() || file.name;

    const form = new FormData();
    // NOTE: keeping field name "file" to match your existing backend handler for this endpoint.
    form.append("file", file, finalName);
    form.append("file_name", finalName);
    form.append("description", meta.description || "");
    form.append("tags", meta.tags || "[]");             // server accepts JSON or comma list

    // Always include resolution if we have it (server will also try to detect for images)
    if (meta.resolution) form.append("resolution", String(meta.resolution));

    // Videos: include duration seconds if available
    if (isVideo(meta.file_type || file.type)) {
      const d = String(meta.duration || "").trim();
      if (d) form.append("duration", d);
    }

    // GLB: optional polygon_count
    if (isGLB(meta.file_type || file.type) || finalName.toLowerCase().endsWith(".glb")) {
      if (meta.polygon_count !== undefined) form.append("polygon_count", String(meta.polygon_count || "").trim());
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload_download", true); // keep your existing endpoint

      // progress
      xhr.upload.addEventListener("progress", (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        updateProgress(key, pct);
      });

      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        const ct = xhr.getResponseHeader("content-type") || "";
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const j = ct.includes("application/json") ? JSON.parse(xhr.responseText) : { ok: true };
            resolve(j);
          } catch {
            resolve({ ok: true });
          }
        } else {
          let msg = `Save failed (${xhr.status} ${xhr.statusText})`;
          try {
            if (ct.includes("application/json")) {
              const j = JSON.parse(xhr.responseText);
              msg += ": " + (j.detail || JSON.stringify(j));
            } else if (xhr.responseText) {
              msg += ": " + xhr.responseText.slice(0, 200);
            }
          } catch {}
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));
      setSaveBusy((s) => ({ ...s, [key]: true }));
      setSaveOK((s) => ({ ...s, [key]: false }));
      xhr.send(form);
    })
      .then((payload) => {
        // Capture the server's returned row to override predicted location
        const row = payload?.asset || payload;
        setSavedInfo((m) => ({ ...m, [key]: row }));
        setSaveOK((s) => ({ ...s, [key]: true }));
        return payload;
      })
      .catch((e) => {
        alert(String(e.message || e));
        throw e;
      })
      .finally(() => {
        setSaveBusy((s) => ({ ...s, [key]: false }));
      });
  }

  // ---------- UI (no JSX) ----------
  function renderDropZone() {
    const styles = {
      border: "2px dashed #888",
      borderRadius: 12,
      padding: 24,
      textAlign: "center",
      background: "#0e0e12",
      color: "#e5e7eb",
      cursor: "pointer",
    };
    const onClick = () => inputRef.current?.click();
    return h(
      "div",
      { ref: dropRef, style: styles, onClick },
      h("div", { style: { fontSize: 18, marginBottom: 8 } }, "Drag & drop files here"),
      h("div", { style: { fontSize: 14, opacity: 0.7 } }, "or click to choose")
    );
  }

  function renderFileList() {
    if (!files.length) return null;
    return h(
      "div",
      { style: { marginTop: 16 } },
      h("div", { style: { fontWeight: 600, marginBottom: 6 } }, "Selected files"),
      h(
        "ul",
        { style: { listStyle: "none", padding: 0, margin: 0 } },
        files.map((f) =>
          h(
            "li",
            {
              key: f.name,
              style: {
                border: "1px solid #262626",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                background: "#111318",
                color: "#e5e7eb",
              },
            },
            h(
              "div",
              { style: { display: "flex", justifyContent: "space-between", gap: 12 } },
              h("span", null, f.name + " (" + humanSize(f.size) + ")"),
              h("span", { style: { fontVariantNumeric: "tabular-nums" } }, (progressMap[f.name] || 0) + "%")
            ),
            h(
              "div",
              {
                style: {
                  height: 6,
                  borderRadius: 4,
                  background: "#1f2937",
                  overflow: "hidden",
                  marginTop: 6,
                },
              },
              h("div", {
                style: {
                  width: (progressMap[f.name] || 0) + "%",
                  height: "100%",
                  background: "#4f46e5",
                  transition: "width 120ms linear",
                },
              })
            )
          )
        )
      )
    );
  }

  // Editable cards for each file BEFORE saving
  function renderEditCards() {
    if (!files.length) return null;

    const fieldLabel = (txt) => h("label", { style: { display: "block", marginBottom: 6, color: "#d1d5db" } }, txt);
    const inputStyle = {
      width: "100%",
      background: "#0b0f15",
      color: "#e5e7eb",
      border: "1px solid #30363d",
      borderRadius: 6,
      padding: "8px 10px",
    };
    const roStyle = { ...inputStyle, color: "#9ca3af" };
    const areaStyle = { ...inputStyle, minHeight: 110, resize: "vertical" };

    return h(
      "div",
      { style: { marginTop: 24 } },
      h("h2", { style: { fontSize: 18, fontWeight: 700, color: "#e5e7eb", marginBottom: 12 } }, "Fill metadata, then Save"),
      ...files.map((f) => {
        const v = localEdits[f.name] || primedFrom(f);
        const set = (k) => (e) => setLocalEdits((prev) => ({ ...prev, [f.name]: { ...prev[f.name], [k]: e.target.value } }));
        const t = String(v.file_type || f.type || "").toLowerCase();

        // show duration field for videos (even if not yet probed)
        const showDuration = t.startsWith("video/");

        // readable size (matches the top list)
        const sizeHuman = humanSize(f.size);

        // Instant location prediction, overridden by server truth after save
        const predicted = predictedInfo[f.name]?.rel;
        const saved = savedInfo[f.name]?.file_location || savedInfo[f.name]?.location;
        const locationValue = saved || predicted || "";

        const isGlb = isGLB(t) || f.name.toLowerCase().endsWith(".glb");

        return h(
          "section",
          {
            key: f.name,
            style: { marginBottom: 16, border: "1px solid #262626", background: "#0a0e14", borderRadius: 10, padding: 16, color: "#e5e7eb" },
          },
          h("div", { style: { fontWeight: 600, marginBottom: 8 } }, f.name + " (" + sizeHuman + ")"),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr", gap: 12 } },

            // Editable metadata
            fieldLabel("File name"),
            h("input", { value: v.file_name || f.name, onChange: set("file_name"), style: inputStyle }),

            fieldLabel("Description"),
            h("textarea", { value: v.description || "", onChange: set("description"), style: areaStyle }),

            fieldLabel("Tags (JSON array or comma list)"),
            h("textarea", { value: v.tags || "[]", onChange: set("tags"), style: areaStyle }),

            // Read-only facts (to mimic your previous review card)
            fieldLabel("File type"),
            h("input", { value: v.file_type || f.type || "", readOnly: true, style: roStyle }),

            fieldLabel("File size"),
            h("input", { value: sizeHuman, readOnly: true, style: roStyle }),

            fieldLabel("File location"),
            h("input", { value: locationValue, readOnly: true, style: roStyle }),

            fieldLabel("Resolution (auto)"),
            h("input", { value: v.resolution || resProbe[f.name] || "", readOnly: true, style: roStyle }),

            showDuration
              ? h(
                  React.Fragment,
                  null,
                  fieldLabel("Duration (auto, seconds)"),
                  h("input", { value: String(v.duration || vidDur[f.name] || ""), readOnly: true, style: roStyle })
                )
              : null,

            isGlb
              ? h(
                  React.Fragment,
                  null,
                  fieldLabel("Polygon count (GLB)"),
                  h("input", { value: v.polygon_count || "", onChange: set("polygon_count"), style: inputStyle })
                )
              : null
          ),
          h(
            "div",
            { style: { marginTop: 12, display: "flex", gap: 8, alignItems: "center" } },
            h(
              "button",
              { type: "button", onClick: () => saveOneNew(f), disabled: !!saveBusy[f.name], style: btnPrimaryStyle(!saveBusy[f.name]) },
              saveBusy[f.name] ? "Saving…" : "Save"
            ),
            saveOK[f.name] ? h("span", { style: { color: "#22c55e" } }, "Saved ✓") : null,
            h("span", { style: { marginLeft: "auto", fontVariantNumeric: "tabular-nums" } }, (progressMap[f.name] || 0) + "%")
          )
        );
      })
    );
  }

  function renderError() {
    if (!error) return null;
    return h(
      "div",
      {
        style: {
          marginTop: 12,
          padding: 12,
          background: "#3b0d0d",
          color: "#fecaca",
          border: "1px solid #7f1d1d",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
        },
      },
      String(error)
    );
  }

  function renderActions() {
    return h(
      "div",
      { style: { marginTop: 16, display: "flex", gap: 8 } },
      h(
        "button",
        { type: "button", onClick: () => inputRef.current?.click(), style: btnStyle(true) },
        "Choose files"
      ),
      h(
        "button",
        {
          type: "button",
          onClick: () => {
            // Clear all selections
            setFiles([]);
            setLocalEdits({});
            setProgressMap({});
            setSaveBusy({});
            setSaveOK({});
            setPredictedInfo({});
            setSavedInfo({});
            setError("");
            if (inputRef.current) inputRef.current.value = "";
          },
          style: btnStyle(true),
        },
        "Clear"
      )
    );
  }

  // ---------- Main ----------
  return h(
    "main",
    { style: { maxWidth: 900, margin: "24px auto", padding: "0 16px", color: "#e5e7eb" } },
    h("h1", { style: { fontSize: 24, fontWeight: 700, marginBottom: 8 } }, "Upload files"),
    h("p", { style: { margin: 0, opacity: 0.8 } }, "Pick files, edit metadata, then press Save on each card to create them."),

    // hidden input
    h("input", {
      ref: inputRef,
      type: "file",
      multiple: true,
      style: { display: "none" },
      onChange: onPick,
    }),

    // drop zone
    h("div", { style: { marginTop: 16 } }, renderDropZone()),

    // selected list + actions
    renderFileList(),
    renderActions(),

    renderError(),

    // Editable cards (pre-save)
    renderEditCards()
  );
}

// --------- tiny helpers
function btnStyle(enabled) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #30363d",
    background: enabled ? "#111827" : "#0b0f15",
    color: "#e5e7eb",
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

function btnPrimaryStyle(enabled) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #4f46e5",
    background: enabled ? "#4f46e5" : "#4338ca",
    color: "#fff",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 600,
  };
}
