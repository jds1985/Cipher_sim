import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ProfilePanel from "../components/ProfilePanel";
import StorePanel from "../components/StorePanel";
import OmniSearchTest from "../components/OmniSearchTest";
import DevicePanel from "../components/DevicePanel";
import ChatPanel from "../components/chat/ChatPanel";
import { themeStyles, defaultThemeKey } from "../logic/themeCore";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // 🔒 Prevent SSR render loops
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const [screen, setScreen] = useState("chat");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [theme, setTheme] = useState(themeStyles[defaultThemeKey]);

  // LOAD PROFILE
  useEffect(() => {
    let cancelled = false;

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
        if (!cancelled && data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error("Profile load error:", err);
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => (cancelled = true);
  }, []);

  // THEME ENGINE (SAFE)
  useEffect(() => {
    const key = profile?.currentTheme || defaultThemeKey;
    setTheme(themeStyles[key] || themeStyles[defaultThemeKey]);
  }, [profile?.currentTheme]);

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
          onProfileChange={(updates) =>
            setProfile((p) => ({ ...(p || {}), ...updates }))
          }
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
          onPreviewTheme={(key) =>
            setTheme(themeStyles[key] || themeStyles[defaultThemeKey])
          }
          onApplyTheme={(key) =>
            setProfile((p) => ({ ...(p || {}), currentTheme: key }))
          }
        />
      )}
    </div>
  );
       }
