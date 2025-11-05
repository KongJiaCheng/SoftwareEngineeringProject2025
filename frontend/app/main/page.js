"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [metadata, setMetadata] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newItem, setNewItem] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const router = useRouter();

  // ✅ Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  // ✅ Logout
  function handleLogout() {
    localStorage.removeItem("user");
    router.push("/login");
  }

  // ✅ Add metadata
  function handleAdd() {
    if (!newItem.trim()) return;
    setMetadata([...metadata, newItem.trim()]);
    setNewItem("");
  }

  // ✅ Delete metadata
  function handleDelete(index) {
    setMetadata(metadata.filter((_, i) => i !== index));
  }

  // ✅ Edit metadata
  function handleEdit(index) {
    setEditIndex(index);
    setNewItem(metadata[index]);
  }

  // ✅ Save edited metadata
  function handleSaveEdit() {
    const updated = [...metadata];
    updated[editIndex] = newItem.trim();
    setMetadata(updated);
    setEditIndex(null);
    setNewItem("");
  }

  // ✅ Filtered search
  const filteredMetadata = metadata.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-lg">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center p-4 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold">Welcome, {user.username}!</h1>
        <button
          onClick={handleLogout}
          className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100"
        >
          Logout
        </button>
      </header>

      {/* Metadata Section */}
      <main className="p-8 space-y-6">
        <h2 className="text-xl font-semibold">Metadata Management</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search metadata..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded-lg w-full"
        />

        {/* Add/Edit Section */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter metadata..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="border p-2 rounded-lg flex-1"
          />
          {editIndex !== null ? (
            <button
              onClick={handleSaveEdit}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              Save
            </button>
          ) : (
            <button
              onClick={handleAdd}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Add
            </button>
          )}
        </div>

        {/* Metadata List */}
        <div className="space-y-2">
          {filteredMetadata.length === 0 ? (
            <p className="text-gray-500 italic">No metadata found.</p>
          ) : (
            filteredMetadata.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border"
              >
                <span>{item}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-yellow-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
