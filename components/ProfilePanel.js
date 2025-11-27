import { useState, useEffect } from "react";

export default function ProfilePanel({ userId }) {
  const [profile, setProfile] = useState(null);

  // Load profile on open
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();
      setProfile(data.profile);
    }
    load();
  }, [userId]);

  // Save profile changes
  const update = async (field, value) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);

    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates: { [field]: value } })
    });
  };

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="profile-panel">
      <h2>Profile Settings</h2>

      <label>Persona Tone</label>
      <select
        value={profile.tone}
        onChange={e => update("tone", e.target.value)}
      >
        <option value="warm">Warm</option>
        <option value="neutral">Neutral</option>
        <option value="stoic">Stoic</option>
      </select>

      <label>Depth Level</label>
      <select
        value={profile.depthLevel}
        onChange={e => update("depthLevel", e.target.value)}
      >
        <option value="basic">Basic</option>
        <option value="balanced">Balanced</option>
        <option value="deep">Deep</option>
      </select>

      <label>Identity Mode</label>
      <select
        value={profile.identityMode}
        onChange={e => update("identityMode", e.target.value)}
      >
        <option value="soul">Soul</option>
        <option value="assistant">Assistant</option>
        <option value="technical">Technical</option>
      </select>

      <label>Theme</label>
      <select
        value={profile.currentTheme}
        onChange={e => update("currentTheme", e.target.value)}
      >
        <option value="default">Default</option>
        <option value="neon">Neon</option>
        <option value="soft">Soft</option>
        <option value="terminal">Terminal</option>
      </select>

      <div className="tier-display">
        Current Tier: {profile.tier}
      </div>
    </div>
  );
}
