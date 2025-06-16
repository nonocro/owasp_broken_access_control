const express = require('express');
const path = require('path');
const admin_actions = require("./admin-actions.js");

const app = express ();
app.use(express.json());

const PORT = process.env.PORT || 3000;


app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

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

// Admin actions
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