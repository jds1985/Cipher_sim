// pages/index.js
import { useState, useEffect } from "react";
import ProfilePanel from "../components/ProfilePanel";
import StorePanel from "../components/StorePanel";
import OmniSearchTest from "../components/OmniSearchTest";
import DevicePanel from "../components/DevicePanel";
import ChatPanel from "../components/chat/ChatPanel";
import { themeStyles, defaultThemeKey } from "../logic/themeCore";

export default function Home() {
  const [screen, setScreen] = useState("chat"); // chat | omni | device
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [theme, setTheme] = useState(themeStyles[defaultThemeKey]);

  // LOAD PROFILE
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let userId = localStorage.getItem("cipher_userId");

        if (!userId) {
          const newRes = await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "newId" }),
          });
          const newData = await newRes.json();
          userId = newData.userId;
          localStorage.setItem("cipher_userId", userId);
        }

        const loadRes = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "load", userId }),
        });

        const data = await loadRes.json();
        if (data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  // UPDATE PROFILE
  const updateProfile = async (updates) => {
    setProfile((prev) => ({ ...(prev || {}), ...updates }));

    try {
      const userId = localStorage.getItem("cipher_userId");
      if (!userId) return;

      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId,
          updates,
        }),
      });
    } catch (err) {
      console.error("Profile save error:", err);
    }
  };

  // THEME ENGINE
  useEffect(() => {
    if (!profile?.currentTheme) {
      setTheme(themeStyles[defaultThemeKey]);
      return;
    }
    setTheme(themeStyles[profile.currentTheme] || themeStyles[defaultThemeKey]);
  }, [profile?.currentTheme]);

  const previewTheme = (themeKey) => {
    setTheme(themeStyles[themeKey] || themeStyles[defaultThemeKey]);
  };

  const applyTheme = (themeKey) => {
    updateProfile({ currentTheme: themeKey });
  };

  // ROUTING SCREENS ======================================================
  if (screen === "device") {
    return <DevicePanel theme={theme} onClose={() => setScreen("chat")} />;
  }

  if (screen === "omni") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.background,
          padding: 20,
          color: theme.textColor,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <button
          onClick={() => setScreen("chat")}
          style={{
            marginBottom: 20,
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: theme.userBubble,
            color: theme.textColor,
          }}
        >
          ← Back to Chat
        </button>

        <OmniSearchTest />
      </div>
    );
  }

  // CHAT SCREEN ==========================================================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        fontFamily: "Inter, sans-serif",
        color: theme.textColor,
        transition: "background 0.4s ease, color 0.4s ease",
      }}
    >
      {/* NEW MODULAR CHAT PANEL WITH HEADER + DRAWER */}
      <ChatPanel theme={theme} />

      {/* PROFILE + STORE PANELS (OVERLAYS) */}
      {menuOpen && (
        <ProfilePanel
          profile={profile}
          loading={profileLoading}
          onClose={() => setMenuOpen(false)}
          onProfileChange={updateProfile}
          onOpenStore={() => {
            setMenuOpen(false);
            setStoreOpen(true);
          }}
        />
      )}

      {storeOpen && (
        <StorePanel
          currentThemeKey={profile?.currentTheme || defaultThemeKey}
          onClose={() => setStoreOpen(false)}
          onPreviewTheme={previewTheme}
          onApplyTheme={applyTheme}
        />
      )}
    </div>
  );
}
