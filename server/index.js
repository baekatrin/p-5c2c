// Load the secret keys from the .env file into process.env
require('dotenv').config();

// Import Express (server framework) and the Supabase client library
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

// Create the Express app (our server)
const app = express();
const PORT = 3000;

// Tell Express to automatically parse JSON data in incoming requests
app.use(express.json());

// createClient() sets up the connection to Supabase project
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// TEST: verify basics are working 
app.get('/', (req, res) => {
    res.json({ message: 'p-5c2c backend is working!'})
});

// TEST: Supabase connection
// This route tries to talk to Supabase and reports back 
// Whether the connected worked or not
app.get('/api/test-db', async (req, res) => {
    try {
        const { data, error } = await supabase.from('_test').select('*"');

        if (error) {
            // Error is expected, the table '_test' doesn't exist yet
            // Error message means connection worked
            res.json({
                connected: true, 
                note: 'Connection to Supabase successful.',
                error: error.message
            });
        } else {
            res.json({ connected: true, data});
        }
    } catch (err) {
        // This catch block runs if something is very wrong
        // like the URl is incorrect or there's no internet
        res.status(500).json({ connected: false, error: err.message});
    }
});

// =================
// Start the server
// =================
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});



