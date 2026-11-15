const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the existing website files
app.use(express.static(path.join(__dirname, "..")));

// Instagram feed API
app.get("/api/instagram", async (req, res) => {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const instagramUserId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !instagramUserId) {
      return res.status(500).json({
        success: false,
        message: "Instagram API credentials are not configured."
      });
    }

    const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";

    const url = new URL(
      `https://graph.facebook.com/v27.0/${instagramUserId}/media`
    );

    url.searchParams.set("fields", fields);
    url.searchParams.set("limit", "8");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("Instagram API error:", data);

      return res.status(response.status).json({
        success: false,
        message: data.error?.message || "Unable to retrieve Instagram posts."
      });
    }

    res.json({
      success: true,
      posts: data.data || []
    });

  } catch (error) {
    console.error("Instagram server error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong while loading Instagram posts."
    });
  }
});

app.listen(PORT, () => {
  console.log(`VISTAS ACM website running at http://localhost:${PORT}`);
});