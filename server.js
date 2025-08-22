// server.js (v2.1 - Multi-User, No Password)

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

// --- 2. MIDDLEWARE ---
app.use(bodyParser.json());

// --- 3. ROUTES ---

// Homepage Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- UPDATED: API Route to get ALL settings (recipients) ---
// This is no longer used by the front-end but is kept for potential future use.
app.get('/api/settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('settings')
            .select('first_name, last_name'); 

        if (error) throw error;
        
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching settings:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
    }
});

// --- UPDATED: API Route to INSERT a new setting (recipient) ---
app.post('/api/settings', async (req, res) => {
    // Password check is removed.
    
    const { first_name, last_name, recipient_email, alert_phone_number } = req.body;

    try {
        // Check if the email already exists to prevent duplicates
        const { data: existingUser, error: selectError } = await supabase
            .from('settings')
            .select('recipient_email')
            .eq('recipient_email', recipient_email)
            .single();
        
        if(selectError && selectError.code !== 'PGRST116'){ // PGRST116 means no row found, which is good
            throw selectError;
        }

        if (existingUser) {
            return res.status(409).json({ success: false, message: 'This email address is already registered.' });
        }

        // If email is not a duplicate, insert the new recipient
        const { error: insertError } = await supabase
            .from('settings')
            .insert({
                first_name,
                last_name,
                recipient_email,
                alert_phone_number,
            });

        if (insertError) throw insertError;
        
        res.json({ success: true, message: 'Recipient added successfully!' });
    } catch (error) {
        console.error('Error saving settings:', error.message);
        res.status(500).json({ success: false, message: 'Failed to save settings.' });
    }
});


// --- 4. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
