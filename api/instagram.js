module.exports = async (req, res) => {
    try {
        const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        const instagramUserId = process.env.INSTAGRAM_USER_ID;

        if (!accessToken || !instagramUserId) {
            return res.status(500).json({
                success: false,
                message: "Instagram credentials are not configured."
            });
        }

        const fields =
            "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";

        const url = new URL(
            `https://graph.facebook.com/v27.0/${instagramUserId}/media`
        );

        url.searchParams.set("fields", fields);
        url.searchParams.set("limit", "8");
        url.searchParams.set("access_token", accessToken);

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                success: false,
                message: data.error?.message || "Unable to retrieve Instagram posts."
            });
        }

        return res.status(200).json({
            success: true,
            posts: data.data || []
        });

    } catch (error) {
        console.error("Instagram API error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load Instagram posts."
        });
    }
};