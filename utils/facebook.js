// utils/facebook.js
// Small helper to post text updates to your Facebook Page

export async function postToFacebook(message) {
  const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FB_PAGE_ID;

  if (!accessToken || !pageId) {
    return {
      success: false,
      error: "Missing FB_PAGE_ACCESS_TOKEN or FB_PAGE_ID environment variables.",
    };
  }

  try {
    const params = new URLSearchParams();
    params.append("message", message);
    params.append("access_token", accessToken);

    // Use the latest Graph version you're on (you were using v24.0)
    const url = `https://graph.facebook.com/v24.0/${pageId}/feed`;

    const response = await fetch(url, {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data?.error?.message || "Unknown error from Facebook API.",
        raw: data,
      };
    }

    return {
      success: true,
      postId: data.id || null,
      raw: data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}
