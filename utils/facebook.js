// utils/facebook.js
// Handles posting to Facebook

export async function postToFacebook(message) {
  try {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
      return { error: "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN" };
    }

    const url = `https://graph.facebook.com/${pageId}/feed`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        access_token: accessToken
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
}
