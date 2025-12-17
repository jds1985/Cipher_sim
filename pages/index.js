import { useState, useEffect } from "react";
import ProfilePanel from "../components/ProfilePanel";
import StorePanel from "../components/StorePanel";
import OmniSearchTest from "../components/OmniSearchTest";
import DevicePanel from "../components/DevicePanel";
import ChatPanel from "../components/chat/ChatPanel";
import { themeStyles, defaultThemeKey } from "../logic/themeCore";

export default function Home() {
  const [mounted, setMounted] = useState(false); // 🔒 SSR GUARD

  const [screen, setScreen] = useState("chat");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [theme, setTheme] = useState(themeStyles[defaultThemeKey]);

  // 🔒 MARK CLIENT MOUNT
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🚫 BLOCK PRERENDER
  if (!mounted) {
    return null;
  }

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

  // THEME ENGINE
  useEffect(() => {
    if (!profile?.currentTheme) {
      setTheme(themeStyles[defaultThemeKey]);
      return;
    }
    setTheme(themeStyles[profile.currentTheme] || themeStyles[defaultThemeKey]);
  }, [profile?.currentTheme]);

  // ROUTING
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
        }}
      >
        <button onClick={() => setScreen("chat")}>← Back</button>
        <OmniSearchTest />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.background,
        color: theme.textColor,
        transition: "background 0.4s ease",
      }}
    >
      <ChatPanel theme={theme} />

      {menuOpen && (
        <ProfilePanel
          profile={profile}
          loading={profileLoading}
          onClose={() => setMenuOpen(false)}
          onProfileChange={() => {}}
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
          onPreviewTheme={() => {}}
          onApplyTheme={() => {}}
        />
      )}
    </div>
  );
      }
