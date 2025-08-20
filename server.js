// server.js (v1.2 - Add Wildcard Route)

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
const PAGE_PASSWORD = process.env.SETTINGS_PASSWORD;

// --- 2. MIDDLEWARE ---
// Serve static files (like CSS or other images if you add them) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Parse JSON bodies from incoming requests
app.use(bodyParser.json());


// --- 3. API ROUTES (These must come BEFORE the wildcard route) ---

// Route to get the current settings from the database
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }
        res.json(data || {});
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
});

// Route to update the settings in the database
app.post('/api/settings', async (req, res) => {
    const { password, email, phone } = req.body;

    if (password !== PAGE_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    try {
        const { error } = await supabase
            .from('settings')
            .upsert({
                id: 1,
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

// --- NEW: Wildcard route to serve the index.html file for any other request ---
// This will fix the "Not Found" error on Render
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// --- 4. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
