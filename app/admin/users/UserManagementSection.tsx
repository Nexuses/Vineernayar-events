"use client";

import React, { useEffect, useState } from "react";

type EventItem = { eventId: string; eventName: string };

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "manager";
  assignedEventIds: string[];
  createdAt: string;
};

type UserDraft = {
  name: string;
  role: "superadmin" | "manager";
  assignedEventIds: string[];
};

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function hasUserChanges(user: AdminUser, draft: UserDraft): boolean {
  if (draft.name.trim() !== user.name) return true;
  if (draft.role !== user.role) return true;
  if (draft.role === "manager") {
    const next = [...draft.assignedEventIds].sort().join(",");
    const current = [...user.assignedEventIds].sort().join(",");
    if (next !== current) return true;
  }
  return false;
}

function draftFromUser(user: AdminUser): UserDraft {
  return {
    name: user.name,
    role: user.role,
    assignedEventIds: [...user.assignedEventIds],
  };
}

export function UserManagementSection({ events }: { events: EventItem[] }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager" as "superadmin" | "manager",
    assignedEventIds: [] as string[],
  });

  const [editDraft, setEditDraft] = useState<Record<string, UserDraft>>({});

  function loadUsers() {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUsers(list);
        setEditDraft(
          Object.fromEntries(list.map((u: AdminUser) => [u.id, draftFromUser(u)]))
        );
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function toggleEventSelection(ids: string[], eventId: string, checked: boolean): string[] {
    if (checked) return [...ids, eventId];
    return ids.filter((id) => id !== eventId);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to create user");
        return;
      }
      setMessage("User created successfully.");
      setShowCreate(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "manager",
        assignedEventIds: [],
      });
      loadUsers();
    } catch {
      setError("Unable to create user");
    }
  }

  async function persistUser(id: string, draft: UserDraft) {
    const user = users.find((u) => u.id === id);
    if (!user || !hasUserChanges(user, draft)) return;

    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          role: draft.role,
          assignedEventIds: draft.role === "superadmin" ? [] : draft.assignedEventIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to update user");
        setEditDraft((prev) => ({ ...prev, [id]: draftFromUser(user) }));
        return;
      }
      const updated: AdminUser = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        assignedEventIds: data.assignedEventIds ?? [],
        createdAt: data.createdAt,
      };
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      setEditDraft((prev) => ({ ...prev, [id]: draftFromUser(updated) }));
    } catch {
      setError("Unable to update user");
      setEditDraft((prev) => ({ ...prev, [id]: draftFromUser(user) }));
    } finally {
      setSavingId(null);
    }
  }

  function updateDraft(id: string, patch: Partial<UserDraft>, save = false) {
    const current = editDraft[id];
    if (!current) return;
    const next = { ...current, ...patch };
    setEditDraft((prev) => ({ ...prev, [id]: next }));
    if (save) void persistUser(id, next);
  }

  async function handleDeleteUser(id: string) {
    if (!window.confirm("Delete this user? They will lose admin access immediately.")) return;
    setDeletingId(id);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to delete user");
        return;
      }
      setMessage("User deleted.");
      loadUsers();
    } catch {
      setError("Unable to delete user");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">Admin users ({users.length})</h2>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          {showCreate ? "Cancel" : "Create user"}
        </button>
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-4 text-sm font-semibold text-zinc-800">New user</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
              <input
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
              <input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
              <input
                required
                type="password"
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Role</label>
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    role: e.target.value as "superadmin" | "manager",
                    assignedEventIds: e.target.value === "superadmin" ? [] : f.assignedEventIds,
                  }))
                }
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
              >
                <option value="manager">Manager</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
          </div>

          {createForm.role === "manager" ? (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-zinc-700">Assigned events</p>
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-zinc-200 p-3">
                {events.length === 0 ? (
                  <p className="text-sm text-zinc-500">No events available.</p>
                ) : (
                  events.map((ev) => (
                    <label key={ev.eventId} className="flex items-center gap-2 text-sm text-zinc-800">
                      <input
                        type="checkbox"
                        checked={createForm.assignedEventIds.includes(ev.eventId)}
                        onChange={(e) =>
                          setCreateForm((f) => ({
                            ...f,
                            assignedEventIds: toggleEventSelection(
                              f.assignedEventIds,
                              ev.eventId,
                              e.target.checked
                            ),
                          }))
                        }
                      />
                      {ev.eventName}
                    </label>
                  ))
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Create user
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading users…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-zinc-500">No admin users yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Name</th>
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Email</th>
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Role</th>
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Events</th>
                <th className="px-3 py-3 font-medium text-zinc-700 sm:px-4">Created</th>
                <th className="w-10 px-2 py-3" aria-label="Delete" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const draft = editDraft[user.id] ?? draftFromUser(user);
                return (
                  <tr key={user.id} className="border-b border-zinc-100 align-top">
                    <td className="px-3 py-3 sm:px-4">
                      <input
                        value={draft.name}
                        onChange={(e) => updateDraft(user.id, { name: e.target.value })}
                        onBlur={(e) => {
                          const next = { ...draft, name: e.target.value };
                          setEditDraft((prev) => ({ ...prev, [user.id]: next }));
                          void persistUser(user.id, next);
                        }}
                        disabled={savingId === user.id}
                        className="w-full min-w-[120px] rounded border border-zinc-300 px-2 py-1 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-3 py-3 text-zinc-700 sm:px-4">{user.email}</td>
                    <td className="px-3 py-3 sm:px-4">
                      <select
                        value={draft.role}
                        onChange={(e) => {
                          const role = e.target.value as "superadmin" | "manager";
                          updateDraft(
                            user.id,
                            {
                              role,
                              assignedEventIds: role === "superadmin" ? [] : draft.assignedEventIds,
                            },
                            true
                          );
                        }}
                        disabled={savingId === user.id}
                        className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-50"
                      >
                        <option value="manager">Manager</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      {draft.role === "superadmin" ? (
                        <span className="text-zinc-600">All events</span>
                      ) : (
                        <div className="max-h-32 space-y-1 overflow-y-auto">
                          {events.map((ev) => (
                            <label
                              key={ev.eventId}
                              className="flex items-center gap-2 text-xs text-zinc-800"
                            >
                              <input
                                type="checkbox"
                                checked={draft.assignedEventIds.includes(ev.eventId)}
                                disabled={savingId === user.id}
                                onChange={(e) =>
                                  updateDraft(
                                    user.id,
                                    {
                                      assignedEventIds: toggleEventSelection(
                                        draft.assignedEventIds,
                                        ev.eventId,
                                        e.target.checked
                                      ),
                                    },
                                    true
                                  )
                                }
                              />
                              {ev.eventName}
                            </label>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-zinc-600 sm:px-4">{formatDate(user.createdAt)}</td>
                    <td className="px-2 py-3">
                      {user.role === "manager" ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingId === user.id || savingId === user.id}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete user"
                          aria-label="Delete user"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
