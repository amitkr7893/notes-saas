"use client";

import { useState, useEffect } from "react";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [plan, setPlan] = useState("FREE");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function fetchNotes() {
    const res = await fetch("/api/notes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setNotes(data);
    } else {
      alert(data.error || "Error fetching notes");
    }
  }

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });
    const data = await res.json();
    if (res.ok) {
      setTitle("");
      setContent("");
      fetchNotes();
    } else {
      alert(data.error || "Error creating note");
    }
  }

  async function deleteNote(id) {
    await fetch(`/api/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotes();
  }

  async function upgradeTenant() {
    if (!tenantSlug) return alert("Missing tenant slug");

    const res = await fetch(`/api/tenants/${tenantSlug}/upgrade`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (res.ok) {
      setPlan("PRO");
      alert("Tenant upgraded to PRO!");
    } else {
      alert(data.error || "Upgrade failed");
    }
  }

  useEffect(() => {
    fetchNotes();

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTenantSlug(payload.tenantId);
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center">

    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notes</h1>

      {/* Notes List */}
      <ul className="space-y-2">
        {notes.map((n) => (
          <li
            key={n.id}
            className="flex justify-between items-center border rounded-lg p-3"
          >
            <div>
              <b>{n.title}</b>
              <p className="text-sm text-gray-600">{n.content}</p>
            </div>
            <button
              onClick={() => deleteNote(n.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {/* Create Note */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Create Note</h3>
        <input
          placeholder="Title"
          className="w-full border rounded-lg p-2 mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Content"
          className="w-full border rounded-lg p-2 mb-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          onClick={createNote}
          className="bg-green-600 text-white rounded-lg px-4 py-2 hover:bg-green-700"
        >
          Add Note
        </button>
      </div>

      {/* Upgrade CTA */}
      {plan === "FREE" && notes.length >= 3 && (
        <div className="mt-6 p-4 border border-yellow-400 bg-yellow-50 rounded-lg">
          <p className="mb-2 text-yellow-700">
            Free plan limit reached. Upgrade to Pro!
          </p>
          <button
            onClick={upgradeTenant}
            className="bg-yellow-500 text-white rounded-lg px-4 py-2 hover:bg-yellow-600"
          >
            Upgrade
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
