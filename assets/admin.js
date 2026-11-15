import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabase;

const form = document.getElementById("login-form");
const message = document.getElementById("login-message");
const button = document.getElementById("login-button");

async function initializeSupabase() {
    try {
        const response = await fetch("/api/config");

        if (!response.ok) {
            throw new Error("Unable to load configuration.");
        }

        const config = await response.json();

        if (!config.supabaseUrl || !config.supabaseKey) {
            throw new Error("Supabase configuration is missing.");
        }

        supabase = createClient(
            config.supabaseUrl,
            config.supabaseKey
        );

    } catch (error) {
        console.error("Supabase initialization error:", error);
        message.textContent = "Unable to connect. Please try again later.";
        button.disabled = true;
    }
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!supabase) {
        message.textContent = "Connection not ready. Please refresh.";
        return;
    }

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    button.disabled = true;
    button.textContent = "AUTHENTICATING...";
    message.textContent = "";

    try {
        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        const user = data.user;

        // Retrieve the user's authorized profile
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            await supabase.auth.signOut();
            throw new Error("No administrator profile found.");
        }

        // Verify administrator role
        if (!["admin", "editor"].includes(profile.role)) {
            await supabase.auth.signOut();
            throw new Error("You are not authorized to access this portal.");
        }

        // Successful login
        sessionStorage.setItem("admin_name", profile.full_name);
        window.location.href = "/admin/dashboard.html";

    } catch (error) {
        console.error("Login error:", error);
        message.textContent = error.message || "Login failed. Please try again.";
    } finally {
        button.disabled = false;
        button.textContent = "ACCESS DASHBOARD →";
    }
});

initializeSupabase();