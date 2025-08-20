// server.js

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

// --- 1. SETUP ---
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// This is the password your colleague will use to access the page.
// IMPORTANT: You will need to set this in your Render environment variables.
const PAGE_PASSWORD = process.env.SETTINGS_PASSWORD;

// --- 2. MIDDLEWARE ---
// Serve static files (like index.html) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Parse JSON bodies from incoming requests
app.use(bodyParser.json());


// --- 3. API ROUTES ---

// Route to get the current settings from the database
app.get('/api/settings', async (req, res) => {
    try {
        // We assume there is only ONE row of settings, with id = 1
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single(); // .single() gets one row instead of an array

        if (error && error.code !== 'PGRST116') { // Ignore 'range not found' error for empty tables
            throw error;
        }

        res.json(data || {}); // Send back the settings data or an empty object
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
});

// Route to update the settings in the database
app.post('/api/settings', async (req, res) => {
    const { password, email, phone } = req.body;

    // --- Password Check ---
    if (password !== PAGE_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    try {
        // Use 'upsert' to either update the row with id=1 or create it if it doesn't exist.
        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 1, // We always want to edit the same row
                recipient_email: email,
                alert_phone_number: phone,
            })
            .eq('id', 1);

        if (error) {
            throw error;
        }

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
