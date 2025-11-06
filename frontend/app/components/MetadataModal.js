'use client';

import { useState, useEffect } from 'react';

export default function MetadataModal({ initial, open, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setTags(initial.tags.join(', '));
      setDescription(initial.description || '');
    } else {
      setTitle('');
      setTags('');
      setDescription('');
    }
  }, [initial, open]);

  if (!open) return null;

  const handleSave = () => {
    if (!title.trim()) return alert('Title required');
    const meta = {
      id: initial?.id || crypto.randomUUID(),
      title: title.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      description: description.trim(),
    };
    onSave(meta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow p-6 w-full max-w-lg z-50">
        <h3 className="text-lg font-medium mb-4">
          {initial ? 'Edit Metadata' : 'Add Metadata'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={4}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-md bg-blue-600 text-white">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
