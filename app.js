const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Change the path where the project is stored
app.use(express.static("D:\\Protected_Login"));

// MongoDB connection URL and database name
const uri = "mongodb+srv://bofaric545:JNrULAu9KoziZybt@cluster0.a7vwv2e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = "users_db";

const jwtSecret = "EixahGJ7mWlGZNC+l1bV9VFTz3k3VJ6hbR8mYzt2b9E="; // Replace with your own secret key

// Function to validate user credentials and generate JWT
async function validateCredentialsAndGenerateToken(collectionName, username, password) {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db(dbName);

        const user = await db.collection(collectionName).findOne({ username });

        if (!user) {
            await client.close();
            return { isValid: false, token: null }; // User not found
        }

        // Decode the base64 encoded password
        const decodedPassword = Buffer.from(user.password, 'base64').toString('utf-8');

        // Compare the decoded password with the provided password using bcrypt
        const isMatch = await bcrypt.compare(password, decodedPassword);

        if (!isMatch) {
            await client.close();
            return { isValid: false, token: null }; // Password does not match
        }

        // Generate JWT
        const token = jwt.sign({ username: user.username, email: user.email }, jwtSecret, { expiresIn: '1h' });

        await client.close();

        return { isValid: true, token: token }; // Return true if passwords match, along with the JWT
    } catch (err) {
        console.error('Error:', err);
        return { isValid: false, token: null }; // Return false in case of any error
    }
}

app.post('/validateUserLogin', async (req, res) => {
    const { username, password } = req.body;

    // Validate user credentials
    const { isValid, token } = await validateCredentialsAndGenerateToken('users', username, password);

    if (isValid) {
        // Send JWT as part of the response
        res.json({ valid: true, token: token });
    } else {
        res.status(401).json({ valid: false, msg: 'Invalid username or password' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join("D:\\Ujucode", 'index.html'));
});

app.post('/signup', async (req, res) => {
    let userExistsFlag = false;

    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db(dbName);
        const coll = db.collection('users');

        const existingUser = await coll.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] });

        if (existingUser) {
            if (existingUser.username === req.body.username) {
                console.log('Username already exists:', existingUser.username);
                userExistsFlag = true;
            }

            if (existingUser.email === req.body.email) {
                console.log('Email already exists:', existingUser.email);
                userExistsFlag = true;
            }
        } else {
            console.log('Username and email do not exist');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.confirm_password, salt);
            const base64HashedPassword = Buffer.from(hashedPassword).toString('base64');

            const user = {
                name: req.body.fullname,
                username: req.body.username,
                email: req.body.email,
                password: base64HashedPassword,
            };

            const result = await coll.insertOne(user);
            console.log(result.insertedId);
        }

        await client.close();

        console.log(userExistsFlag);

        return res.sendFile(path.join(__dirname, 'signup_confirmation.html'));

    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
