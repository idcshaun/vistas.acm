module.exports = (req, res) => {
    res.setHeader("Content-Type", "application/json");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
            error: "Supabase configuration is missing."
        });
    }

    return res.status(200).json({
        supabaseUrl,
        supabaseKey
    });
};