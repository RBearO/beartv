"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTheme } from "@/contexts/ThemeContext";
import {
  MAX_INTEREST_LENGTH,
  MAX_INTERESTS,
  MIN_INTEREST_LENGTH,
  normalizeInterestKey,
  PRESET_INTERESTS,
  validateInterest,
} from "@/lib/interests";
import { X } from "lucide-react";

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

function presetLabel(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function hasInterest(selected: string[], candidate: string) {
  const key = normalizeInterestKey(candidate);
  return selected.some((item) => normalizeInterestKey(item) === key);
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [interestError, setInterestError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    gender: "PREFER_NOT_TO_SAY",
    country: "",
    interests: [] as string[],
    countryFilter: "",
    genderPreference: "",
    autoConnect: false,
    showOnlineStatus: true,
  });

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile({
            name: data.name || "",
            bio: data.bio || "",
            gender: data.gender || "PREFER_NOT_TO_SAY",
            country: data.country || "",
            interests:
              data.interests?.map(
                (i: { interest: { name: string; slug: string } }) =>
                  i.interest.name || i.interest.slug
              ) || [],
            countryFilter: data.settings?.countryFilter || "",
            genderPreference: data.settings?.genderPreference || "",
            autoConnect: data.settings?.autoConnect || false,
            showOnlineStatus: data.settings?.showOnlineStatus ?? true,
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profile.name,
        bio: profile.bio,
        gender: profile.gender,
        country: profile.country,
        interests: profile.interests,
        countryFilter: profile.countryFilter || null,
        genderPreference: profile.genderPreference || null,
        autoConnect: profile.autoConnect,
        showOnlineStatus: profile.showOnlineStatus,
        darkMode: theme === "dark",
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setInterestError(data.error || "Failed to save changes.");
      return;
    }
    setInterestError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addInterest = (raw: string) => {
    const result = validateInterest(raw, profile.interests);
    if (!result.ok) {
      setInterestError(result.error);
      return;
    }
    setInterestError(null);
    setProfile((p) => ({ ...p, interests: [...p.interests, result.label] }));
    setCustomInput("");
  };

  const removeInterest = (label: string) => {
    setInterestError(null);
    setProfile((p) => ({
      ...p,
      interests: p.interests.filter(
        (item) => normalizeInterestKey(item) !== normalizeInterestKey(label)
      ),
    }));
  };

  const togglePreset = (slug: string) => {
    if (hasInterest(profile.interests, slug)) {
      removeInterest(slug);
      return;
    }
    addInterest(presetLabel(slug));
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 px-4 app-page">
        <div className="max-w-2xl mx-auto space-y-[var(--control-gap)]">
          <div className="flex items-center gap-4">
            <Avatar src={session?.user?.image} name={profile.name} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name || "Your Profile"}</h1>
              <p className="text-sm text-white/40">{session?.user?.email}</p>
            </div>
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
            <div className="space-y-4">
              <Input
                label="Display Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-bear-brown/50 resize-none"
                  placeholder="Tell others about yourself..."
                />
              </div>
              <Input
                label="Country"
                value={profile.country}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                placeholder="e.g. United States"
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-bear-brown/50"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value} className="bg-bear-gray">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="text-lg font-semibold text-white">Interests</h2>
              <span className="text-xs text-white/40">
                {profile.interests.length}/{MAX_INTERESTS}
              </span>
            </div>

            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4" aria-label="Selected interests">
                {profile.interests.map((interest) => (
                  <span
                    key={normalizeInterestKey(interest)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-bear-brown text-white"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="rounded-full p-0.5 hover:bg-white/20"
                      aria-label={`Remove ${interest}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-white/50 mb-2">Suggested</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_INTERESTS.map((interest) => {
                const selected = hasInterest(profile.interests, interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => togglePreset(interest)}
                    disabled={!selected && profile.interests.length >= MAX_INTERESTS}
                    className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors disabled:opacity-40 ${
                      selected
                        ? "bg-bear-brown text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70" htmlFor="custom-interest">
                Custom interest
              </label>
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <Input
                    id="custom-interest"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value.slice(0, MAX_INTEREST_LENGTH));
                      setInterestError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addInterest(customInput);
                      }
                    }}
                    placeholder="e.g. Video Games"
                    maxLength={MAX_INTEREST_LENGTH}
                    aria-describedby="interest-hint interest-error"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addInterest(customInput)}
                  disabled={profile.interests.length >= MAX_INTERESTS}
                  className="shrink-0 mt-0"
                >
                  Add
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p id="interest-hint" className="text-xs text-white/40">
                  {MIN_INTEREST_LENGTH}–{MAX_INTEREST_LENGTH} characters. Max {MAX_INTERESTS} interests.
                </p>
                <p className="text-xs text-white/40 tabular-nums">
                  {customInput.length}/{MAX_INTEREST_LENGTH}
                </p>
              </div>
              {interestError && (
                <p id="interest-error" className="text-sm text-red-400" role="alert">
                  {interestError}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Match Preferences</h2>
            <div className="space-y-4">
              <Input
                label="Country Filter (optional)"
                value={profile.countryFilter}
                onChange={(e) => setProfile({ ...profile, countryFilter: e.target.value })}
                placeholder="Match users from this country"
              />
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Gender Preference (optional)</label>
                <select
                  value={profile.genderPreference}
                  onChange={(e) => setProfile({ ...profile, genderPreference: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-bear-brown/50"
                >
                  <option value="" className="bg-bear-gray">Any</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value} className="bg-bear-gray">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
            <div className="space-y-3">
              {[
                { key: "autoConnect" as const, label: "Auto-connect on page load" },
                { key: "showOnlineStatus" as const, label: "Show online status" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-white/70">{label}</span>
                  <input
                    type="checkbox"
                    checked={profile[key]}
                    onChange={(e) => setProfile({ ...profile, [key]: e.target.checked })}
                    className="accent-bear-brown w-4 h-4"
                  />
                </label>
              ))}
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <Button variant="gold" onClick={handleSave} isLoading={saving} className="flex-1">
              Save Changes
            </Button>
            {saved && <Badge variant="success">Saved!</Badge>}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
