// utils/facebook.js
// Simple wrapper for Facebook Graph API posting

export async function postToFacebookPage(message) {
  const PAGE_ID = process.env.FB_PAGE_ID;
  const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

  if (!PAGE_ID || !PAGE_ACCESS_TOKEN) {
    return { error: "Missing Facebook environment variables." };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${PAGE_ID}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    );

    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
}
