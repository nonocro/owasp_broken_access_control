const express = require('express');
const fs = require('fs');
const path = require('path');
const admin_actions = require("./admin-actions.js");
const cookie = require('cookie');
var cookieParser = require('cookie-parser')

EDIT_MODE = false;

const User = {
  id: Number,
  name: String,
  email: String,
  description: String,
  company: String,
  password: String,
  is_admin: Boolean
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <-- Add this line
app.use(cookieParser());
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
  if (req.cookies["userId"] !== undefined && req.cookies["is_admin"] == "true"){
    admin_actions.shutdown(true);
    res.status(200).send("Ok");
    return;
  }

  res.status(403).send("unauthorized");
})

app.get("/admin/shutdown", (req, res) => {
  if (req.cookies["userId"] !== undefined && req.cookies["is_admin"] == "true"){
    admin_actions.shutdown();
    res.status(200).send("Ok");
    return;
  }
  
  res.status(403).send("unauthorized");
})

app.get("/admin/clearDatabase", (req, res) => {
  if (req.cookies["userId"] !== undefined && req.cookies["is_admin"] == "true"){
    admin_actions.clearDatabase();
    res.status(200).send("Database Cleared Successfully.");
    return;
  }
  
  res.status(403).send("unauthorized");
})

app.get("/admin/help", (req, res) => {
  console.log(req.cookies["is_admin"])
  if (req.cookies["userId"] !== undefined && req.cookies["is_admin"] == "true"){
    res.status(200).send("Admin help : <br>/clearDatabase : Clear db<br>/reboot : reboot production server (in case something is stuck)<br>/shutdown : shutdown production server (do not use unless urgent)");
    return;
  }

  res.status(403).send("unauthorized");
  
})

app.get('/signup', function(req, res) {
  res.sendFile(path.join(__dirname, '/signup.html'));
});

app.get('/signin', function(req, res) {
  res.sendFile(path.join(__dirname, '/signin.html'));
});

app.get("/signout", (req, res) => {
  res.clearCookie("userId")
  res.clearCookie("is_admin")
  res.status(200).send("Signed out")
})

app.post('/user', (req, res) => {
    const newUser = req.body;
    const usersFile = path.join(__dirname, 'users.json');
    fs.readFile(usersFile, 'utf8', (err, data) => {
        let users = [];
        if (!err && data) {
            try {
                users = JSON.parse(data);
            } catch (e) {
                return res.status(500).send('Format users.json invalide.');
            }
        }

        let newId = 1;
        if (users.length > 0) {
            const lastUser = users[users.length - 1];
            newId = (parseInt(lastUser.id) || 0) + 1;
        }
        newUser.id = newId;

        users.push(newUser);

        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('Erreur lors de l\'enregistrement.');
            res.redirect(`/user/${encodeURIComponent(newUser.id)}`);
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

        const rows = users.map(u => `
            <tr>
                <td>${u.username || ''}</td>
                <td>${u.email || ''}</td>
                <td>${u.description || ''}</td>
                <td>${u.company || ''}</td>
                <td>
                    <a href="/user/${encodeURIComponent(u.id)}">
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

app.get('/edit-mode/:id', (req, res) => {
    const id = req.params.id;
    EDIT_MODE = !EDIT_MODE;
    res.redirect(`/user/${encodeURIComponent(id)}`);
});

app.get('/user/:id', (req, res) => {
    console.log("EDIT_MODE", EDIT_MODE);
    const id = req.params.id;
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
        
        const user = users.find(u => u.id === id);
        if (!user) return res.status(404).send('Utilisateur non trouvé.');

        let cookies = {};
        if (req.headers.cookie) {
            cookies = cookie.parse(req.headers.cookie);
        }
        let editModeButton = '';
        if( cookies['userId'] === user.id){
            editModeButton = `<button onclick="location.href='/edit-mode/${encodeURIComponent(user.id)}'">${EDIT_MODE ? 'Désactiver le mode édition' : 'Activer le mode édition'}</button>`;
        }
        let canEdit = EDIT_MODE;
        let editButton = '';
        if (canEdit) {
            editButton = `<button type="submit">Modifier</button>`;
        }

        fs.readFile(htmlFile, 'utf8', (err, html) => {
            if (err) return res.status(500).send('Fichier HTML non trouvé.');
            let result = html
                .replace(/<!-- USER_ID -->/g, user.id || '')
                .replace(/<!-- USERNAME -->/g, user.username || '')
                .replace('<!-- EMAIL -->', user.email || '')
                .replace('<!-- DESCRIPTION -->', user.description || '')
                .replace('<!-- COMPANY -->', user.company || '')
                .replace(/<!-- READONLY_ATTR -->/g, canEdit ? '' : 'readonly')
                .replace('<!-- EDIT_BUTTON -->', editButton)
                .replace('<!-- EDIT_MODE_BUTTON -->', editModeButton);
            res.send(result);
        });
    });
});

app.post('/user/update/:id', (req, res) => {
    const id = req.params.id;
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

        const userIndex = users.findIndex(user => user.id === id);
        if (userIndex === -1) return res.status(404).send('User not found.');

        users[userIndex] = { ...users[userIndex], ...updatedUser };

        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) return res.status(500).send('Error updating user.');
            res.redirect(`/user/${encodeURIComponent(id)}`);
        });
    });
});

app.post('/user/login', (req, res) => {
    const { username, password } = req.body;

    const usersFile = path.join(__dirname, 'users.json');
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading users file.');

        let users = [];
        try {
            users = JSON.parse(data);
        } catch (e) {
            return res.status(500).send('Invalid users file.');
        }

        const user = users.find(u => u.username === username && u.password === password);
        if (!user) return res.status(401).send('Invalid credentials.');

        res.cookie('userId', user.id, { httpOnly: true });
        res.cookie("is_admin", user.is_admin == undefined ? false : true, { httpOnly: true });
        res.redirect(`/user/${encodeURIComponent(user.id)}`);
    });
});

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});
