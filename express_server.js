var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

function generateRandomString() {
  var randomString = "";
  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++){
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return randomString;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur" },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get('/urls', (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            user: users[req.cookies['user_id']],
                            user_id: req.cookies['user_id']};
  res.render('urls_index', templateVariables);
});

app.get("/urls/new", (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            user_id: req.cookies['user_id'],
                            user: users[req.cookies['user_id']]};
  res.render("urls_new", templateVariables);
  console.log(users[req.cookies['user']]);
});

app.get("/register", (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            user_id: req.cookies['user_id'],
                            user: users[req.cookies['user_id']]};
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  if (req.body.password === '' || req.body.email === ''){
    res.status(404).send('One of your entries was empty!');
  } else {
    for (user in users){
      if (users[user]['email'] === req.body.email){
        res.status(400).send("Email in use already");
      }
    }
  }
  users[userID] = { id: userID,
                    email: req.body.email,
                    password: req.body.password};
  res.cookie('user_id', userID);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  let templateVariables = { urls: urlDatabase,
                            shortURL: key,
                            user_id: req.cookies['user_id']};
  res.redirect(`/urls/${key}`);
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];

  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  for (user in users){
    if (users[user]['email'] === req.body.email){
      if (users[user]['password'] === req.body.password){
        res.cookie('user_id', users[user]['id']);
        res.redirect('/urls');
      } else {
        res.status(403).send("Password was inputed incorrectly");
      }
    }
  }
    res.status(403).send('No user with this email can be found');
});

app.get("/login", (req, res) => {
  var templateVariables = {user: users[req.cookies['user_id']],
                          user_id: req.cookies['user_id']};
  res.render("urls_login", templateVariables);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/urls/:id', (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            shortURL: req.params.id,
                            user: users[req.cookies['user_id']],
                            user_id: req.cookies['user_id']};
  res.render('urls_show', templateVariables);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL);
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
