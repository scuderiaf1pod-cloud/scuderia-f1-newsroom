// server.js (v1.3 - Repaired with explicit homepage route)

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

// --- 1. SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
// These values are read from the Environment Variables in Render.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// This is the password your colleague will use to access the page.
// This value is also read from the Environment Variables in Render.
const PAGE_PASSWORD = process.env.SETTINGS_PASSWORD;

// --- 2. MIDDLEWARE ---
// Serve static files (like CSS or other images if you add them) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Parse JSON bodies from incoming requests, making them available on req.body
app.use(bodyParser.json());


// --- 3. ROUTES ---

// --- A. Homepage Route (The Fix) ---
// This specifically tells the server to send your index.html file
// when someone visits the main root URL of your site (e.g., "https://your-app-name.onrender.com/").
app.get('/', (req, res) => {
    // It assumes 'index.html' is in the same root directory as this server.js file.
    res.sendFile(path.join(__dirname, 'index.html'));
});


// --- B. API Routes (These handle data) ---

// Route to get the current settings from the Supabase database
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1) // We are always working with the single settings row with id = 1
            .single();

        // A 'PGRST116' error from Supabase just means "no rows found", which is okay.
        // We throw any other kind of error.
        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        // Send the data back as JSON, or an empty object if no data was found.
        res.json(data || {});
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
});

// Route to update or insert the settings in the database
app.post('/api/settings', async (req, res) => {
    const { password, email, phone } = req.body;

    // First, check if the provided password matches the one from our environment variables.
    if (password !== PAGE_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    // If the password is correct, proceed to update the database.
    try {
        const { error } = await supabase
            .from('settings')
            .upsert({ // 'upsert' will create the row if it doesn't exist, or update it if it does.
                id: 1,
                recipient_email: email,
                alert_phone_number: phone,
            })
            .eq('id', 1); // Specify which row to update

        if (error) {
            throw error;
        }
        // Send a success response back to the browser.
        res.json({ success: true, message: 'Settings saved successfully!' });
    } catch (error) {
        console.error('Error saving settings:', error.message);
        res.status(500).json({ success: false, message: 'Failed to save settings.' });
    }
});


// --- 4. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
