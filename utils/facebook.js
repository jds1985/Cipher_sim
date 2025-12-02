// utils/facebook.js

export async function publishToFacebook(message) {
  try {
    const PAGE_ID = process.env.FB_PAGE_ID;
    const TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

    if (!PAGE_ID || !TOKEN) {
      throw new Error("Missing FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN in environment variables.");
    }

    const url = `https://graph.facebook.com/${PAGE_ID}/feed`;

    const params = new URLSearchParams({
      message: message,
      access_token: TOKEN
    });

    const response = await fetch(url, {
      method: "POST",
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Facebook API error:", data);
      throw new Error(data.error?.message || "Failed to publish to Facebook.");
    }

    return {
      success: true,
      postId: data.id,
      message: "Post successfully published to Facebook."
    };

  } catch (error) {
    console.error("publishToFacebook error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
