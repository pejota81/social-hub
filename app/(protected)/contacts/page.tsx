"use client";

import { useEffect, useState, useCallback } from "react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  notes: string | null;
  sourceProvider: string | null;
  createdAt: string;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  notes: "",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const limit = 20;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search && { search }),
    });
    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleSubmit = async () => {
    if (!form.firstName.trim()) {
      setMessage("First name is required");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : "/api/contacts";
      const method = editingContact ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save contact");
      setShowForm(false);
      setEditingContact(null);
      setForm(emptyForm);
      setMessage(
        editingContact ? "Contact updated!" : "Contact created!"
      );
      fetchContacts();
    } catch {
      setMessage("Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSelectedContact(null);
      fetchContacts();
      setMessage("Contact deleted.");
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      company: contact.company ?? "",
      jobTitle: contact.jobTitle ?? "",
      notes: contact.notes ?? "",
    });
    setShowForm(true);
    setSelectedContact(null);
  };

  const handleSync = async (provider: "google" | "microsoft") => {
    setSyncing(provider);
    setMessage("");
    try {
      const res = await fetch("/api/contacts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(
        `Synced ${data.total} contacts from ${provider} (${data.created} new, ${data.updated} updated).`
      );
      fetchContacts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setMessage(`Sync error: ${msg}`);
    } finally {
      setSyncing(null);
    }
  };

  const openNewForm = () => {
    setEditingContact(null);
    setForm(emptyForm);
    setShowForm(true);
    setSelectedContact(null);
  };

  const providerBadge = (provider: string | null) => {
    if (!provider) return null;
    const colors: Record<string, string> = {
      google: "bg-red-100 text-red-700",
      microsoft: "bg-blue-100 text-blue-700",
      apple: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[provider] ?? "bg-gray-100 text-gray-600"}`}
      >
        {provider}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleSync("google")}
            disabled={syncing !== null}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {syncing === "google" ? "Syncing..." : "Sync Google"}
          </button>
          <button
            onClick={() => handleSync("microsoft")}
            disabled={syncing !== null}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {syncing === "microsoft" ? "Syncing..." : "Sync Microsoft"}
          </button>
          <button
            onClick={openNewForm}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg text-sm ${
            message.includes("error") || message.includes("Failed")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-6">
        {/* Contact list */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              Loading contacts...
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <p className="text-lg mb-2">No contacts found</p>
              <p className="text-sm">Add a contact or sync from a provider</p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    onClick={() =>
                      setSelectedContact(
                        selectedContact?.id === contact.id ? null : contact
                      )
                    }
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedContact?.id === contact.id ? "bg-indigo-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {contact.firstName} {contact.lastName}
                          </span>
                          {providerBadge(contact.sourceProvider)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {contact.email && <span>{contact.email}</span>}
                          {contact.company && (
                            <span className="ml-2 text-gray-400">
                              · {contact.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>
                  {total} contact{total !== 1 ? "s" : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40"
                  >
                    ←
                  </button>
                  <span>
                    {page} / {Math.max(1, Math.ceil(total / limit))}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(total / limit)}
                    className="px-2 py-1 border border-gray-200 rounded disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Contact detail / form panel */}
        {(showForm || selectedContact) && (
          <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 p-5 self-start">
            {showForm ? (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingContact ? "Edit Contact" : "New Contact"}
                </h2>
                <div className="space-y-3">
                  {[
                    { key: "firstName", label: "First Name *", type: "text" },
                    { key: "lastName", label: "Last Name", type: "text" },
                    { key: "email", label: "Email", type: "email" },
                    { key: "phone", label: "Phone", type: "tel" },
                    { key: "company", label: "Company", type: "text" },
                    { key: "jobTitle", label: "Job Title", type: "text" },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={form[key as keyof typeof form]}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, [key]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, notes: e.target.value }))
                      }
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex-1 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingContact(null);
                    }}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : selectedContact ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h2>
                  {providerBadge(selectedContact.sourceProvider)}
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  {selectedContact.email && (
                    <div>
                      <span className="font-medium text-gray-500">Email</span>
                      <p>{selectedContact.email}</p>
                    </div>
                  )}
                  {selectedContact.phone && (
                    <div>
                      <span className="font-medium text-gray-500">Phone</span>
                      <p>{selectedContact.phone}</p>
                    </div>
                  )}
                  {selectedContact.company && (
                    <div>
                      <span className="font-medium text-gray-500">Company</span>
                      <p>{selectedContact.company}</p>
                    </div>
                  )}
                  {selectedContact.jobTitle && (
                    <div>
                      <span className="font-medium text-gray-500">
                        Job Title
                      </span>
                      <p>{selectedContact.jobTitle}</p>
                    </div>
                  )}
                  {selectedContact.notes && (
                    <div>
                      <span className="font-medium text-gray-500">Notes</span>
                      <p>{selectedContact.notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(selectedContact)}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(selectedContact.id)}
                    className="flex-1 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
