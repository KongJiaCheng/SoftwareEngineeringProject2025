"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Upload page
 * - Drag & drop or pick files
 * - Sends multipart/form-data with field name "files"
 * - Uses XHR to report per-file upload progress
 * - POST /api/upload_download/  (Next proxy -> Django /api/upload/)
 * - Renders results from Django response (e.g., { uploaded: [...] })
 */

export default function UploadPage() {
  const h = React.createElement;

  const [files, setFiles] = useState([]);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({}); // filename -> %
  const inputRef = useRef(null);
  const dropRef = useRef(null);

  // Helpers -----
  function updateProgress(filename, pct) {
    setProgressMap(function (prev) {
      return Object.assign({}, prev, { [filename]: pct });
    });
  }

  function humanSize(n) {
    if (!Number.isFinite(n)) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(1) + " MB";
  }

  function setBusy(v) {
    setIsUploading(v);
    if (v) setError("");
  }

  // File selection / DnD

  const onPick = useCallback(function (e) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setProgressMap({});
    setResults(null);
    setError("");
  }, []);

  const onDrop = useCallback(function (e) {
    e.preventDefault();
    e.stopPropagation();
    const list = Array.from(e.dataTransfer?.files || []);
    if (list.length === 0) return;
    setFiles(list);
    setProgressMap({});
    setResults(null);
    setError("");
  }, []);

  const onDragOver = useCallback(function (e) {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  useEffect(function attachDnD() {
    const node = dropRef.current;
    if (!node) return;
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("drop", onDrop);
    return function cleanup() {
      node.removeEventListener("dragover", onDragOver);
      node.removeEventListener("drop", onDrop);
    };
  }, [onDragOver, onDrop]);

  // --- Upload logic (XHR for progress) ------------------------------------

  async function uploadAll(e) {
    e && e.preventDefault();
    if (!files.length) {
      setError("Please choose at least one file.");
      return;
    }

    setBusy(true);
    setResults(null);
    setProgressMap({});

    // Build multipart form; backend expects field name "files"
    const form = new FormData();
    files.forEach(function (f) {
      form.append("files", f, f.name);
    });

    try {
      const data = await xhrUpload("/api/upload_download/", form, updateProgress);
      setResults(data || null);
    } catch (err) {
      setError(String(err && err.message ? err.message : err));
    } finally {
      setBusy(false);
    }
  }

  function xhrUpload(url, body, onProgress) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);

      // Progress per total payload. We'll map it back to each file name evenly,
      // and also expose overall progress under key "__TOTAL__".
      xhr.upload.addEventListener("progress", function (evt) {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);

        // overall
        onProgress("__TOTAL__", pct);

        // naive per-file progress (even split). This keeps UI simple.
        if (Array.isArray(files) && files.length > 0) {
          const each = Math.min(100, Math.max(0, pct));
          files.forEach(function (f) {
            onProgress(f.name, each);
          });
        }
      });

      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        const ct = xhr.getResponseHeader("content-type") || "";
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            if (ct.includes("application/json")) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              resolve({ ok: true, raw: xhr.responseText });
            }
          } catch (e) {
            resolve({ ok: true, raw: xhr.responseText });
          }
        } else {
          let msg = "Upload failed (" + xhr.status + " " + xhr.statusText + ")";
          try {
            if (ct.includes("application/json")) {
              const j = JSON.parse(xhr.responseText);
              msg += ": " + (j.detail || JSON.stringify(j));
            } else if (xhr.responseText) {
              msg += ": " + xhr.responseText.slice(0, 300);
            }
          } catch (_) {}
          reject(new Error(msg));
        }
      };

      xhr.onerror = function () {
        reject(new Error("Network error during upload"));
      };

      xhr.send(body);
    });
  }

  // --- UI elements (no JSX) -----------------------------------------------

  function renderDropZone() {
    const styles = {
      border: "2px dashed #888",
      borderRadius: 12,
      padding: 24,
      textAlign: "center",
      background: "#fafafa",
      cursor: "pointer",
    };

    const onClick = function () {
      if (inputRef.current) inputRef.current.click();
    };

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
        files.map(function (f) {
          const p = progressMap[f.name] || 0;
          return h(
            "li",
            {
              key: f.name,
              style: {
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
              },
            },
            h(
              "div",
              { style: { display: "flex", justifyContent: "space-between", gap: 12 } },
              h("span", null, f.name + " (" + humanSize(f.size) + ")"),
              h("span", { style: { fontVariantNumeric: "tabular-nums" } }, p + "%")
            ),
            h("div", {
              style: {
                height: 6,
                borderRadius: 4,
                background: "#eee",
                overflow: "hidden",
                marginTop: 6,
              },
            },
              h("div", {
                style: {
                  width: p + "%",
                  height: "100%",
                  background: "#4f46e5",
                  transition: "width 120ms linear",
                },
              })
            )
          );
        })
      )
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
          disabled: isUploading,
          onClick: function () {
            if (inputRef.current) inputRef.current.click();
          },
          style: btnStyle(!isUploading),
        },
        "Choose files"
      ),
      h(
        "button",
        {
          type: "button",
          disabled: isUploading || files.length === 0,
          onClick: uploadAll,
          style: btnPrimaryStyle(!(isUploading || files.length === 0)),
        },
        isUploading ? "Uploading…" : "Upload"
      )
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
          background: "#fef2f2",
          color: "#991b1b",
          border: "1px solid #fecaca",
          borderRadius: 8,
          whiteSpace: "pre-wrap",
        },
      },
      String(error)
    );
  }

  function renderResults() {
    if (!results) return null;
    return h(
      "div",
      { style: { marginTop: 20 } },
      h("div", { style: { fontWeight: 600, marginBottom: 8 } }, "Server response"),
      h(
        "pre",
        {
          style: {
            overflowX: "auto",
            padding: 12,
            background: "#0b1020",
            color: "#e6edf3",
            borderRadius: 8,
          },
        },
        safeJson(results)
      )
    );
  }

  // --- Main container ------------------------------------------------------

  return h(
    "main",
    { style: { maxWidth: 800, margin: "24px auto", padding: "0 16px" } },
    h("h1", { style: { fontSize: 24, fontWeight: 700, marginBottom: 8 } }, "Upload files"),
    h(
      "p",
      { style: { margin: 0, opacity: 0.8 } },
      "Select or drop files. They will be sent as multipart/form-data under the field ",
      h("code", null, "files"),
      "."
    ),

    // hidden input for file picking
    h("input", {
      ref: inputRef,
      type: "file",
      multiple: true,
      style: { display: "none" },
      onChange: onPick,
    }),

    // drop zone
    h("div", { style: { marginTop: 16 } }, renderDropZone()),

    // selected files + actions
    renderFileList(),
    renderActions(),

    // global overall progress
    (progressMap["__TOTAL__"] > 0
      ? h(
          "div",
          { style: { marginTop: 12 } },
          h("div", { style: { fontWeight: 600, marginBottom: 4 } }, "Overall"),
          h("div", {
            style: {
              height: 8,
              borderRadius: 5,
              background: "#eee",
              overflow: "hidden",
            },
          },
            h("div", {
              style: {
                width: progressMap["__TOTAL__"] + "%",
                height: "100%",
                background: "#22c55e",
                transition: "width 120ms linear",
              },
            })
          )
        )
      : null),

    renderError(),
    renderResults()
  );
}

// --- tiny helpers (styles / JSON pretty) ------------------------------------

function btnStyle(enabled) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: enabled ? "#fff" : "#f3f4f6",
    color: "#111827",
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

function btnPrimaryStyle(enabled) {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #4f46e5",
    background: enabled ? "#4f46e5" : "#a5b4fc",
    color: "#fff",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 600,
  };
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return String(obj);
  }
}
