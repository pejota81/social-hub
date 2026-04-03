"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    bio: "",
    phone: "",
    location: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch profile");
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name ?? "",
          bio: data.bio ?? "",
          phone: data.phone ?? "",
          location: data.location ?? "",
        });
      })
      .catch(() => setFetchError(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setProfile(updated);
      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load profile. Please refresh the page.</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={profile.name ?? "User"}
                width={80}
                height={80}
                className="rounded-full border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
                {(profile.name ?? profile.email ?? "?")[0].toUpperCase()}
              </div>
            )}
          </div>

          {message && (
            <div
              className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                message.includes("success")
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bio: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {profile.name ?? "No name set"}
                  </h2>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit Profile
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {profile.bio && (
                  <p className="text-gray-700">{profile.bio}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <span>📞</span> {profile.phone}
                    </span>
                  )}
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <span>📍</span> {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>🗓</span> Joined{" "}
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
