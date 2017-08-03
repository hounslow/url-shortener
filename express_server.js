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
                            username: req.cookies['username']};
  res.render('urls_index', templateVariables);
});

app.get("/urls/new", (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            username: req.cookies['username']};
  res.render("urls_new", templateVariables);
});

app.get("/register", (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            username: req.cookies['username']};
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  //let templateVariables = { urls: urlDatabase,
    //                        username: req.cookies['username']};
  const userID = generateRandomString();
  users[userID] = { id: userID,
                    email: req.body.email,
                    password: req.body.password};
  console.log(users[userID]);
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  let templateVariables = { urls: urlDatabase,
                            shortURL: key,
                            username: req.cookies['username']};
  res.redirect(`/urls/${key}`);
});

app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];

  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.get('/urls/:id', (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            shortURL: req.params.id,
                            username: req.cookies['username']};
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
