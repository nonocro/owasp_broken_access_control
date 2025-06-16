const express = require('express');
const fs = require('fs');
const path = require('path');
const admin_actions = require("./admin-actions.js");

const User = {
  name: String,
  email: String,
  description: String,
  company: String,
  password: String
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- Add this line

const PORT = process.env.PORT || 3000;


app.get('/status', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/hello-world', (req, res) => {
  res.status(200).json('Hello World');
});

app.get('/hello-world/:name', (req, res) => {
  const name = req.params.name;
  res.status(200).json(`Hello ${name}`);
});

app.get('/index', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.get("/admin/reboot", (req, res) => {
  admin_actions.shutdown(true);
  res.status(200).send("Ok");
})

app.get("/admin/shutdown", (req, res) => {
  admin_actions.shutdown();
  res.status(200).send("Ok");
})

app.get("/admin/clearDatabase", (req, res) => {
  admin_actions.clearDatabase();
  res.status(200).send("Database Cleared Successfully.");
})
app.get('/signup', function(req, res) {
  res.sendFile(path.join(__dirname, '/signup.html'));
});

app.post('/user', (req, res) => {
    const newUser = req.body;
    console.log('New user data:', newUser);
    
    const usersFile = path.join(__dirname, 'users.json');
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading users file.');

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            users = [];
        }

        users.push(newUser);

        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('Error saving user.');
            res.status(201).send('User added.');
        });
    });
});

app.get('/users', (req, res) => {
    const usersFile = path.join(__dirname, 'users.json');
    const htmlFile = path.join(__dirname, 'users.html');
    fs.readFile(usersFile, 'utf8', (err, data) => {
        let users = [];
        if (!err && data) {
            try {
                users = JSON.parse(data);
            } catch (e) {
                return res.status(500).send('Invalid users.json format.');
            }
        }
        // Generate table rows
        const rows = users.map(u => `
            <tr>
                <td>${u.username || ''}</td>
                <td>${u.email || ''}</td>
                <td>${u.description || ''}</td>
                <td>${u.company || ''}</td>
                <td>
                    <a href="/user/${encodeURIComponent(u.username)}">
                        <button>Voir</button>
                    </a>
                </td>
            </tr>
        `).join('');

        // Read HTML template and insert rows
        fs.readFile(htmlFile, 'utf8', (err, html) => {
            if (err) return res.status(500).send('HTML template not found.');
            const result = html.replace('<!-- USERS_TABLE -->', rows);
            res.send(result);
        });
    });
});


app.get('/user/:username', (req, res) => {
    const username = req.params.username;
    const usersFile = path.join(__dirname, 'users.json');
    const htmlFile = path.join(__dirname, 'user.html');

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Erreur lors de la lecture des utilisateurs.');
        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Format users.json invalide.');
        }
        const user = users.find(u => u.username === username);
        if (!user) return res.status(404).send('Utilisateur non trouvé.');

        fs.readFile(htmlFile, 'utf8', (err, html) => {
            if (err) return res.status(500).send('Fichier HTML non trouvé.');
            let result = html
                .replace(/<!-- USERNAME -->/g, user.username || '')
                .replace('<!-- EMAIL -->', user.email || '')
                .replace('<!-- DESCRIPTION -->', user.description || '')
                .replace('<!-- COMPANY -->', user.company || '');
            res.send(result);
        });
    });
});

app.post('/user/update/:username', (req, res) => {
    const username = req.params.username;
    const updatedUser = req.body;

    const usersFile = path.join(__dirname, 'users.json');
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading users file.');

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Invalid users file.');
        }

        const userIndex = users.findIndex(user => user.username === username);
        if (userIndex === -1) return res.status(404).send('User not found.');

        users[userIndex] = { ...users[userIndex], ...updatedUser };

        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('Error updating user.');
            res.status(200).send('User updated.');
        });
    });
});

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});
