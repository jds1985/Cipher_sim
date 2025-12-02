// utils/facebookPoster.js
// Simple helper to post to a Facebook Page feed

export async function postToFacebook({ message }) {
  const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
  const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!PAGE_ID || !PAGE_TOKEN) {
    throw new Error(
      "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN environment variables."
    );
  }

  const url = `https://graph.facebook.com/${PAGE_ID}/feed`;

  const params = new URLSearchParams();
  params.append("message", message);
  params.append("access_token", PAGE_TOKEN);

  const res = await fetch(url, {
    method: "POST",
    body: params,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Facebook post error:", data);
    throw new Error(
      `Facebook API error: ${data.error?.message || "Unknown error"}`
    );
  }

  return data; // contains id of the post, etc.
}
