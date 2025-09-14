"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false); // overlay state
  const [userRole, setUserRole] = useState(""); // ADMIN | MEMBER
  const [userId, setUserId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  const router = useRouter();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // wrapper to show overlay during async ops
  async function withLoader(fn) {
    try {
      setLoading(true);
      await fn();
    } finally {
      setLoading(false);
    }
  }

  // fetch notes — supports two shapes:
  // 1) [{...}, {...}]  OR
  // 2) { notes: [...], tenant: {...}, notesCount: N }
  async function fetchNotes() {
    try {
      const res = await fetch("/api/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      console.log(data);
      if (!res.ok) {
        alert(data.error || "Error fetching notes");
        return;
      }

      // support both shapes
      if (Array.isArray(data)) {
        setNotes(data);
        // tenant info not provided — keep existing tenant state
      } else {
        if (data.notes) setNotes(data.notes);
        if (data.tenant) {
          setTenantId(data.tenant.id || data.tenantId || "");
          setTenantName(data.tenant.name || data.tenant.slug || "");
          setPlan(data.tenant.plan || "FREE");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Network error while fetching notes");
    }
  }

  async function createNote() {
    // if free and >=3 notes, backend will block — but we prevent UI attempt too
    if (plan === "FREE" && notes.length >= 3) {
      return alert("Free plan limit reached. Please upgrade to Pro.");
    }

    await withLoader(async () => {
      try {
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
          await fetchNotes();
        } else {
          alert(data.error || "Error creating note");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while creating note");
      }
    });
  }

  async function deleteNote(id) {
    if (!confirm("Delete this note?")) return;
    await withLoader(async () => {
      try {
        const res = await fetch(`/api/notes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          await fetchNotes();
        } else {
          alert(data.error || "Error deleting note");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while deleting note");
      }
    });
  }

  async function updateNote() {
    if (!editingNote) return;
    await withLoader(async () => {
      try {
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editingNote.title,
            content: editingNote.content,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setEditingNote(null);
          await fetchNotes();
        } else {
          alert(data.error || "Error updating note");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while updating note");
      }
    });
  }

  async function upgradeTenant() {
    if (!tenantName && !tenantId) {
      return alert("Missing tenant identifier");
    }

    // Prefer slug (tenantName) if available, otherwise fallback to tenantId
    const slug = tenantName || tenantId;

    await withLoader(async () => {
      try {
        const res = await fetch(`/api/tenants/${slug}/upgrade`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        let data = {};
        try {
          // Try reading body safely
          const text = await res.text();
          data = text ? JSON.parse(text) : {};
        } catch (err) {
          console.warn("Non-JSON response:", err);
        }

        if (res.ok) {
          setPlan("PRO");
          alert("Tenant upgraded to PRO!");
          await fetchNotes();
        } else {
          alert(data.error || "Upgrade failed");
        }
      } catch (err) {
        console.error(err);
        alert("Network error while upgrading");
      }
    });
  }

  async function inviteUser() {
    if (!inviteEmail) return setInviteMsg("Please enter an email to invite.");
    if (!tenantName && !tenantId) return setInviteMsg("Missing tenant slug.");

    setInviteMsg("");
    await withLoader(async () => {
      try {
        const slug = tenantName || tenantId;
        const res = await fetch(`/api/tenants/${slug}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: inviteEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          setInviteEmail("");
          setInviteMsg("Invite created (user added).");
          await fetchNotes();
        } else {
          setInviteMsg(data.error || "Invite failed");
        }
      } catch (err) {
        console.error(err);
        setInviteMsg("Network error while inviting");
      }
    });
  }

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  // decode token to get user info (role, tenantId, userId)
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || "");
        setUserId(payload.userId || "");
        // prefer tenant slug if available in payload as tenantSlug, else id
        if (payload.tenantSlug) {
          setTenantName(payload.tenantSlug);
        } else if (payload.tenantId) {
          setTenantId(payload.tenantId);
        }
      } catch (err) {
        console.warn("Invalid token payload", err);
      }
    }
    // initial fetch
    withLoader(fetchNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: determine if a note was created by an admin
  function isAdminNote(note) {
    // prefer owner.role if backend provided it
    if (note.owner && note.owner.role) {
      return note.owner.role === "ADMIN";
    }
    // fallback: compare ownerId to current user role (if this user is admin then mark as admin? no)
    // If backend didn't provide owner role, we cannot reliably mark; return false.
    return false;
  }

  return (
    <div className="relative flex min-h-screen w-full items-start justify-center py-8">
      {/* Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white text-sm font-medium mt-4">Working...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notes</h1>
            <p className="text-sm text-gray-400">
              {tenantName
                ? `${tenantName}`
                : tenantId
                ? `Tenant: ${tenantId}`
                : "Tenant"}
              {" • "}
              <span className="font-medium">{userRole || "User"}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {userRole === "ADMIN" && plan == "FREE" && (
              <button
                onClick={() => {
                  const proceed = confirm("Upgrade tenant to Pro now?");
                  if (proceed) upgradeTenant();
                }}
                className="bg-yellow-500 text-white rounded-md px-3 py-2 text-sm hover:bg-yellow-600"
                disabled={loading}
              >
                Upgrade to Pro
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-zinc-800 text-white rounded-md px-3 py-2 text-sm hover:bg-zinc-900"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: notes list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900 rounded-lg shadow p-4">
              <h3 className="font-semibold mb-3">Company Notes</h3>

              <ul className="space-y-2">
                {notes.length === 0 && (
                  <li className="text-sm text-gray-500">No notes yet.</li>
                )}
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="flex justify-between items-start border rounded-lg p-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <b>{n.title}</b>
                        {isAdminNote(n) && (
                          <span className="text-xs bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                            ADMIN
                          </span>
                        )}
                        {/* {n.owner && n.owner.email && (
                          <span className="text-xs text-gray-500 ml-2">
                            by {n.owner.email}
                          </span>
                        )} */}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 max-w-100">{n.content}</p>
                    </div>

                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <div className="flex space-x-2">
                        {/* Show Edit/Delete only if current user is owner */}
                        {(userRole === "ADMIN" || n.ownerId === userId) && (
                          <>
                            <button
                              onClick={() => setEditingNote({ ...n })}
                              className="text-blue-600 text-sm hover:underline rounded-sm bg-zinc-800 hover:cursor-pointer hover:opacity-80"
                              disabled={loading}
                            >
                              <img src="/edit.png" className="h-6 w-6" alt="Edit" />
                              {/* Edit */}
                            </button>
                            <button
                              onClick={() => deleteNote(n.id)}
                              className="text-red-600 text-sm hover:underline hover:cursor-pointer hover:opacity-80"
                              disabled={loading}
                            >
                              <img src="/bin.png" className="h-5 w-5" alt="delete" />
                              {/* Delete */}
                            </button>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column: create / edit / admin controls */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-lg shadow p-4">
              {!editingNote ? (
                <>
                  <h3 className="font-semibold mb-2">Create Note</h3>
                  <input
                    placeholder="Title"
                    className="w-full border rounded-lg p-2 mb-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                  />
                  <textarea
                    placeholder="Content"
                    className="w-full border rounded-lg p-2 mb-2"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    onClick={createNote}
                    className="w-full bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
                    disabled={loading || (plan === "FREE" && notes.length >= 3)}
                  >
                    Add Note
                  </button>

                  {plan === "FREE" && notes.length >= 3 && (
                    <p className="text-sm text-yellow-600 mt-3">
                      Free tenant limit reached (3). Upgrade to Pro to add more.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-2">Edit Note</h3>
                  <input
                    className="w-full border rounded-lg p-2 mb-2"
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                    disabled={loading}
                  />
                  <textarea
                    className="w-full border rounded-lg p-2 mb-2"
                    value={editingNote.content}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        content: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={updateNote}
                      className="bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
                      disabled={loading}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNote(null)}
                      className="bg-gray-300 text-gray-800 rounded-lg px-4 py-2 hover:bg-gray-400"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Admin only: Invite users */}
            {userRole === "ADMIN" && (
              <div className="bg-zinc-900 rounded-lg shadow p-4">
                <h3 className="font-semibold mb-2">Invite user (Admin)</h3>
                <input
                  placeholder="Email to invite"
                  className="w-full border rounded-lg p-2 mb-2"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={loading}
                />
                <button
                  onClick={inviteUser}
                  className="w-full bg-teal-600 text-white rounded-lg px-4 py-2 hover:bg-teal-700"
                  disabled={loading}
                >
                  Invite
                </button>
                {inviteMsg && (
                  <p className="text-sm text-gray-400 mt-2">{inviteMsg}</p>
                )}
              </div>
            )}

            {/* Small tenant & plan info */}
            <div className="bg-zinc-900 rounded-lg shadow p-4 text-sm">
              <div>
                <strong>Tenant:</strong> {tenantName || tenantId || "—"}
              </div>
              <div>
                <strong>Plan:</strong> {plan}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
