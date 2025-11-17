"use client";
import "./upload.css";
import React, { useCallback, useEffect, useRef, useState } from "react";

// NEW: three.js + GLTFLoader for GLB probing
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function fileExt(name = "") {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

// ⭐ NEW: helper to normalize tags into an array
function parseTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((t) => String(t)).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    // try JSON array first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t)).filter(Boolean);
      }
    } catch {}
    // fallback: comma / newline list
    return trimmed
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

// tiny helpers
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

export default function UploadPage() {
  const h = React.createElement;
  

  // State
  const [files, setFiles] = useState([]); // File objects chosen (not yet saved)
  const [error, setError] = useState("");
  const [progressMap, setProgressMap] = useState({}); // filename -> %
  const [localEdits, setLocalEdits] = useState({}); // filename -> editable metadata
  const [saveBusy, setSaveBusy] = useState({}); // filename -> boolean
  const [saveOK, setSaveOK] = useState({}); // filename -> true
  const [predictedInfo, setPredictedInfo] = useState({}); // { "original.ext": { rel, url } } (shown immediately)
  const [savedInfo, setSavedInfo] = useState({}); // { "original.ext": serverRow } (shown after save)

  // Client-probed metadata by ORIGINAL filename (before save)
  const [vidDur, setVidDur] = useState({}); // { "name.mp4": seconds }
  const [resProbe, setResProbe] = useState({}); // { "name.jpg": "1920x1080" }

  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // NEW: GLTF loader instance (only on client)
  const gltfLoaderRef = useRef(null);
  useEffect(() => {
    gltfLoaderRef.current = new GLTFLoader();
  }, []);

  const ALLOWED_MIME_PREFIX = ["image/", "video/"];
  const ALLOWED_MIME_EXACT = ["model/gltf-binary", "model/gltf+json"];
  const ALLOWED_EXT = [".glb"];

  function isAllowedFile(f) {
    const t = String(f.type || "").toLowerCase();
    const ext = fileExt(f.name);
    if (ALLOWED_MIME_PREFIX.some((p) => t.startsWith(p))) return true; // image/* or video/*
    if (ALLOWED_MIME_EXACT.includes(t)) return true; // proper glTF mimes
    if (ALLOWED_EXT.includes(ext)) return true; // .glb
    return false;
  }

  // Helpers
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
    return (
      n.endsWith(".glb") ||
      t.includes("gltf") ||
      (t.includes("octet-stream") && n.endsWith(".glb"))
    );
  };

  // Build default edit object from a file + client probes
  const primedFrom = (f) => {
    const ext = fileExt(f.name);
    const type = String(
      f.type ||
        (ext === ".glb"
          ? "model/gltf-binary"
          : ext === ".gltf"
          ? "model/gltf+json"
          : "")
    ).toLowerCase();

    return {
      file_name: f.name,
      file_type: type,
      file_size: f.size,
      description: "",
      // ⭐ CHANGED: tags as array, not "[]"
      tags: [],
      tagInput: "", // ⭐ NEW: per-file tag input buffer
      resolution: resProbe[f.name] || "", // auto (read-only)
      duration: vidDur[f.name] || "", // auto for videos (read-only)
      polygon_count: "", // GLB optional (editable in future if needed)
      no_of_versions: 1, // default; real value comes from backend after save
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
      return (
        name
          .toLowerCase()
          .replace(/\.[^.]+$/, "") // drop extension
          .replace(/[^a-z0-9]+/g, "-") // non-alnum -> hyphen
          .replace(/^-+|-+$/g, "") // trim hyphens
          .slice(0, 48) || "file"
      );
    }

    function shortId(n = 7) {
      const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let out = "";
      for (let i = 0; i < n; i++) out += chars[(Math.random() * chars.length) | 0];
      return out;
    }

    const next = {};
    Array.from(fileList).forEach((f) => {
      const ext = (f.name.includes(".") ? f.name.split(".").pop() : "").toLowerCase();
      const base = slugifyBase(f.name);
      const finalName = ext
        ? `${base}_${shortId()}.${ext}`
        : `${base}_${shortId()}`;
      const rel = `${dir}/${finalName}`;
      next[f.name] = { rel, url: `/media/${rel}` }; // change /media if your MEDIA_URL differs
    });

    setPredictedInfo((prev) => ({ ...prev, ...next }));
  }

  // NEW: probe GLB locally (resolution + polygon count)
  function probeGlbMeta(file, url) {
    if (!gltfLoaderRef.current) {
      URL.revokeObjectURL(url);
      return;
    }

    const loader = gltfLoaderRef.current;

    loader.load(
      url,
      (gltf) => {
        let polyCount = 0;
        const box = new THREE.Box3();

        gltf.scene.traverse((obj) => {
          if (obj.isMesh && obj.geometry) {
            const geom = obj.geometry;

            if (geom.index) {
              polyCount += geom.index.count / 3;
            } else if (geom.attributes && geom.attributes.position) {
              polyCount += geom.attributes.position.count / 3;
            }

            box.expandByObject(obj);
          }
        });

        const size = new THREE.Vector3();
        box.getSize(size);
        const res3d = `${size.x.toFixed(1)}x${size.y.toFixed(
          1
        )}x${size.z.toFixed(1)}`;

        // store "resolution" for our existing auto-resolution flow
        setResProbe((prev) => ({ ...prev, [file.name]: res3d }));

        // directly patch polygon_count into localEdits
        setLocalEdits((prev) => {
          const existing = prev[file.name] || primedFrom(file);
          return {
            ...prev,
            [file.name]: {
              ...existing,
              resolution: existing.resolution || res3d,
              polygon_count: Math.round(polyCount),
            },
          };
        });

        URL.revokeObjectURL(url);
      },
      undefined,
      (err) => {
        console.error("GLB meta probe error", err);
        URL.revokeObjectURL(url);
      }
    );
  }

  /** Probe local media metadata (duration & resolution) before save */
  function probeMediaMeta(fileList) {
    fileList.forEach((f) => {
      const type = String(f.type || "");
      const lowerName = f.name.toLowerCase();
      const url = URL.createObjectURL(f);

      // ---- GLB FIRST ----
      if (
        lowerName.endsWith(".glb") ||
        lowerName.endsWith(".gltf") ||
        type.includes("gltf")
      ) {
        probeGlbMeta(f, url);
        return;
      }

      // Images -> resolution via <img>
      if (type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || img.width || 0;
          const h = img.naturalHeight || img.height || 0;
          if (w && h) {
            setResProbe((prev) => ({
              ...prev,
              [f.name]: `${Math.round(w)}x${Math.round(h)}`,
            }));
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

  // Pick & DnD
  const onPick = useCallback(
    (e) => {
      const picked = Array.from(e.target.files || []);
      if (!picked.length) return;

      const valid = picked.filter(isAllowedFile);
      const rejected = picked.filter((f) => !isAllowedFile(f));

      if (rejected.length) {
        alert(
          "The following files were rejected (only images, videos, .glb, .gltf allowed):\n\n" +
            rejected.map((f) => "• " + f.name).join("\n")
        );
      }
      if (!valid.length) {
        // clear everything if nothing valid
        setFiles([]);
        setLocalEdits({});
        setProgressMap({});
        setSaveBusy({});
        setSaveOK({});
        setPredictedInfo({});
        setSavedInfo({});
        setError("");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      // reset UI state
      setError("");
      setProgressMap({});
      setSaveBusy({});
      setSaveOK({});
      setPredictedInfo({});
      setSavedInfo({});

      // store valid files only
      setFiles(valid);
      predictForPickedFiles(valid);
      probeMediaMeta(valid);

      const init = {};
      valid.forEach((f) => (init[f.name] = primedFrom(f)));
      setLocalEdits(init);
    },
    [resProbe, vidDur]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dropped = Array.from(e.dataTransfer?.files || []);
      if (!dropped.length) return;

      const valid = dropped.filter(isAllowedFile);
      const rejected = dropped.filter((f) => !isAllowedFile(f));

      if (rejected.length) {
        alert(
          "The following files were rejected (only images, videos, .glb, .gltf allowed):\n\n" +
            rejected.map((f) => "• " + f.name).join("\n")
        );
      }
      if (!valid.length) {
        // clear everything if nothing valid
        setFiles([]);
        setLocalEdits({});
        setProgressMap({});
        setSaveBusy({});
        setSaveOK({});
        setPredictedInfo({});
        setSavedInfo({});
        setError("");
        return;
      }

      // reset UI state
      setError("");
      setProgressMap({});
      setSaveBusy({});
      setSaveOK({});
      setPredictedInfo({});
      setSavedInfo({});

      // store valid files only
      setFiles(valid);
      predictForPickedFiles(valid);
      probeMediaMeta(valid);

      const init = {};
      valid.forEach((f) => (init[f.name] = primedFrom(f)));
      setLocalEdits(init);
    },
    [resProbe, vidDur]
  );

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

  // Keep localEdits in sync when async probes finish (images/videos)
  useEffect(() => {
    if (!files.length) return;
    setLocalEdits((prev) => {
      const next = { ...prev };
      files.forEach((f) => {
        const name = f.name;
        const cur = next[name] || {};
        // If resolution empty but probe arrived, set it
        if (
          (!cur.resolution || String(cur.resolution).trim() === "") &&
          resProbe[name]
        ) {
          next[name] = { ...cur, resolution: resProbe[name] };
        }
        // If duration empty but video probe arrived, set it
        if (
          (!cur.duration || String(cur.duration).trim() === "") &&
          vidDur[name]
        ) {
          next[name] = { ...(next[name] || cur), duration: vidDur[name] };
        }
      });
      return next;
    });
  }, [resProbe, vidDur, files]);

  // Per-file Save
  async function saveOneNew(file) {
    const key = file.name;
    const meta = localEdits[key] || {};

    // Require a file name
    const finalName = (meta.file_name || "").trim() || file.name;

    // Validate file type
    if (!isAllowedFile(file)) {
      alert("Unsupported file type. Only images, videos, .glb, or .gltf are allowed.");
      throw new Error("Unsupported file type");
    }

    const form = new FormData();
    form.append("file", file, finalName);
    form.append("file_name", finalName);
    form.append("description", meta.description || "");

    // ⭐ NEW: convert tags array to JSON string when sending
    let tagsToSend = meta.tags;
    if (Array.isArray(tagsToSend)) {
      tagsToSend = JSON.stringify(tagsToSend);
    }
    form.append("tags", tagsToSend || "[]");

    if (meta.resolution) form.append("resolution", String(meta.resolution));

    if (isVideo(meta.file_type || file.type)) {
      const d = String(meta.duration || "").trim();
      if (d) form.append("duration", d);
    }

    if (isGLB(meta.file_type || file.type) || finalName.toLowerCase().endsWith(".glb")) {
      if (meta.polygon_count !== undefined)
        form.append("polygon_count", String(meta.polygon_count || "").trim());
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload_download", true);

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
            const j = ct.includes("application/json")
              ? JSON.parse(xhr.responseText)
              : { ok: true };
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

  // UI
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
      h(
        "div",
        { style: { fontSize: 18, marginBottom: 8 } },
        "Drag & drop files here"
      ),
      h(
        "div",
        { style: { fontSize: 14, opacity: 0.7 } },
        "or click to choose"
      )
    );
  }

  function renderFileList() {
    if (!files.length) return null;
    return h(
      "div",
      { style: { marginTop: 16 } },
      h(
        "div",
        { style: { fontWeight: 600, marginBottom: 6 } },
        "Selected files"
      ),
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
              {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                },
              },
              h("span", null, f.name + " (" + humanSize(f.size) + ")"),
              h(
                "span",
                { style: { fontVariantNumeric: "tabular-nums" } },
                (progressMap[f.name] || 0) + "%"
              )
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

    const fieldLabel = (txt) =>
      h(
        "label",
        { style: { display: "block", marginBottom: 6, color: "#d1d5db" } },
        txt
      );

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
      h(
        "h2",
        {
          style: {
            fontSize: 18,
            fontWeight: 700,
            color: "#e5e7eb",
            marginBottom: 12,
          },
        },
        "Fill metadata, then Save"
      ),
      ...files.map((file) => {
        const baseEdit = localEdits[file.name] || primedFrom(file);

        const server = savedInfo[file.name] || {};
        const ext = fileExt(file.name);

        // File type: server > local > browser > by extension
        const fileTypeValue =
          server.file_type ||
          baseEdit.file_type ||
          file.type ||
          (ext === ".glb"
            ? "model/gltf-binary"
            : ext === ".gltf"
            ? "model/gltf+json"
            : "");

        // Resolution: server > local > probe
        const resolutionValue =
          server.resolution ?? baseEdit.resolution ?? resProbe[file.name] ?? "";

        // Polygon count (GLB): server > local
        const polygonValue =
          server.polygon_count ?? baseEdit.polygon_count ?? "";

        // ⭐ NEW: derive tags array + input buffer
        const rawTags = server.tags ?? baseEdit.tags ?? [];
        const tagsArray = parseTags(rawTags);
        const tagInputValue = baseEdit.tagInput || "";

        const set =
          (k) =>
          (e) =>
            setLocalEdits((prev) => ({
              ...prev,
              [file.name]: { ...prev[file.name], [k]: e.target.value },
            }));

        const t = String(baseEdit.file_type || file.type || "").toLowerCase();

        // show duration field for videos (even if not yet probed)
        const showDuration = t.startsWith("video/");

        // readable size (matches the top list)
        const sizeHuman = humanSize(file.size);

        // Instant location prediction, overridden by server truth after save
        const predicted = predictedInfo[file.name]?.rel;
        const saved =
          savedInfo[file.name]?.file_location || savedInfo[file.name]?.location;
        const locationValue = saved || predicted || "";

        const isGlbFile = isGLB(t) || file.name.toLowerCase().endsWith(".glb");

        // Handlers for tag add / remove
        const handleTagInputChange = (e) => {
          const val = e.target.value;
          setLocalEdits((prev) => ({
            ...prev,
            [file.name]: { ...(prev[file.name] || baseEdit), tagInput: val },
          }));
        };

        const handleAddTag = () => {
          const newTag = (tagInputValue || "").trim();
          if (!newTag) return;
          setLocalEdits((prev) => {
            const current = prev[file.name] || baseEdit;
            const currentTags = parseTags(current.tags ?? []);
            if (currentTags.includes(newTag)) {
              // no duplicates; just clear input
              return {
                ...prev,
                [file.name]: { ...current, tagInput: "" },
              };
            }
            return {
              ...prev,
              [file.name]: {
                ...current,
                tags: [...currentTags, newTag],
                tagInput: "",
              },
            };
          });
        };

        const handleRemoveTag = (tag, idx) => {
          setLocalEdits((prev) => {
            const current = prev[file.name] || baseEdit;
            const currentTags = parseTags(current.tags ?? []);
            const nextTags = currentTags.filter(
              (tVal, i) => !(tVal === tag && i === idx)
            );
            return {
              ...prev,
              [file.name]: {
                ...current,
                tags: nextTags,
              },
            };
          });
        };

        return h(
          "section",
          {
            key: file.name,
            style: {
              marginBottom: 16,
              border: "1px solid #262626",
              background: "#0a0e14",
              borderRadius: 10,
              padding: 16,
              color: "#e5e7eb",
            },
          },
          h(
            "div",
            { style: { fontWeight: 600, marginBottom: 8 } },
            file.name + " (" + sizeHuman + ")"
          ),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr", gap: 12 } },

            // Editable metadata
            fieldLabel("File name"),
            h("input", {
              value: baseEdit.file_name || file.name,
              onChange: set("file_name"),
              style: inputStyle,
            }),

            fieldLabel("Description"),
            h("textarea", {
              value: baseEdit.description || "",
              onChange: set("description"),
              style: areaStyle,
            }),

            // ⭐ NEW TAG UI
            fieldLabel("Tags"),
            h(
              "div",
              {
                style: {
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                },
              },
              h("input", {
                value: tagInputValue,
                onChange: handleTagInputChange,
                style: { ...inputStyle, width: "100%" },
                placeholder: "Type a tag and click Add",
              }),
              h(
                "button",
                {
                  type: "button",
                  onClick: handleAddTag,
                  style: btnStyle(true),
                },
                "Add"
              )
            ),
            tagsArray.length
              ? h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 4,
                    },
                  },
                  ...tagsArray.map((tag, idx) =>
                    h(
                      "span",
                      {
                        key: tag + idx,
                        style: {
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 8px",
                          borderRadius: 9999,
                          border: "1px solid #4b5563",
                          background: "#111827",
                          fontSize: 12,
                        },
                      },
                      tag,
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleRemoveTag(tag, idx),
                          style: {
                            border: "none",
                            background: "transparent",
                            color: "#fca5a5",
                            cursor: "pointer",
                            fontSize: 12,
                            lineHeight: 1,
                            padding: 0,
                          },
                        },
                        "✕"
                      )
                    )
                  )
                )
              : h(
                  "div",
                  {
                    style: {
                      fontSize: 12,
                      opacity: 0.7,
                      marginTop: 4,
                    },
                  },
                  "No tags yet. Add one above."
                ),

            // Read-only facts
            fieldLabel("File type"),
            h("input", { value: fileTypeValue, readOnly: true, style: roStyle }),

            fieldLabel("File size"),
            h("input", { value: sizeHuman, readOnly: true, style: roStyle }),

            fieldLabel("File location"),
            h("input", { value: locationValue, readOnly: true, style: roStyle }),

            fieldLabel("Resolution (auto)"),
            h("input", { value: resolutionValue, readOnly: true, style: roStyle }),

            showDuration
              ? h(
                  React.Fragment,
                  null,
                  fieldLabel("Duration (auto, seconds)"),
                  h("input", {
                    value: String(baseEdit.duration || vidDur[file.name] || ""),
                    readOnly: true,
                    style: roStyle,
                  })
                )
              : null,

            isGlbFile
              ? h(
                  React.Fragment,
                  null,
                  fieldLabel("Polygon count (auto)"),
                  h("input", {
                    value: String(polygonValue || ""),
                    readOnly: true,
                    style: roStyle,
                  })
                )
              : null
          ),
          h(
            "div",
            {
              style: {
                marginTop: 12,
                display: "flex",
                gap: 8,
                alignItems: "center",
              },
            },
            h(
              "button",
              {
                type: "button",
                onClick: () => saveOneNew(file),
                disabled: !!saveBusy[file.name],
                style: btnPrimaryStyle(!saveBusy[file.name]),
              },
              saveBusy[file.name] ? "Saving…" : "Save"
            ),
            saveOK[file.name]
              ? h(
                  "span",
                  { style: { color: "#22c55e" } },
                  "Saved ✓",
                  setTimeout(() => (window.location.replace('main')), 1000)
                )
              : null,
            h(
              "span",
              {
                style: {
                  marginLeft: "auto",
                  fontVariantNumeric: "tabular-nums",
                },
              },
              (progressMap[file.name] || 0) + "%"
            )
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
        {
          type: "button",
          onClick: () => inputRef.current?.click(),
          style: btnStyle(true),
        },
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

  // Main
  return h(
    "main",
    {
      style: {
        maxWidth: 900,
        margin: "24px auto",
        padding: "0 16px",
        color: "#e5e7eb",
        backgroundColor: "transparent",
      },
    },

    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: 16,
        },
      },
      h(
        "button",
        {
          type: "button",
          onClick: () => window.location.replace('/main'), // navigate to main page
          style: {
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #4f46e5",
            background: "#4f46e5",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          },
        },
        "Back To Main Page"
      )
    ),

    // Existing content
    h(
      "h1",
      { style: { fontSize: 24, fontWeight: 700, marginBottom: 8 } },
      "Upload files"
    ),

    h(
      "p",
      { style: { margin: 0, opacity: 0.8 } },
      "Pick files, edit metadata, then press Save on each card to create them."
    ),

    // hidden input
    h("input", {
      ref: inputRef,
      type: "file",
      multiple: true,
      style: { display: "none" },
      accept: "image/*,video/*,.glb",
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
