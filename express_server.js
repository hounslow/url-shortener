const bcrypt = require('bcrypt');
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
var cookieSession = require('cookie-session');
const bodyParser = require("body-parser");

app.use(cookieSession({
  name: 'session',
  secret: "Some kind of secret here",
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

function generateRandomString() {
  var randomString = "";
  var charset = "ABCDEFGHIJKLMNOPQESTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++){
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return randomString;
}

const urlDatabase = {
  "b2xVn2": {userID: 'userRandomID', longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {userID: 'user2RandomID', longURL: "http://www.google.com"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10) },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

function urlsForUser(id){
  let newURLs = {};
  for (urlItem in urlDatabase){
    if (urlDatabase[urlItem]['userID'] === id){
      newURLs[urlItem] = urlDatabase[urlItem];
    }
  }
  return newURLs;
}

app.get('/urls', (req, res) => {
    let templateVariables = { urls: urlsForUser(req.session.user_id),
                            user: users[req.session.user_id],
                            user_id: req.session.user_id};
    res.render('urls_index', templateVariables);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id){
    res.status(302).redirect('/login');
  } else {
    let templateVariables = { urls: urlDatabase,
                              user_id: req.session.user_id,
                              user: users[req.session.user_id]};
    res.render("urls_new", templateVariables);
  }
});

app.get("/register", (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            user_id: req.session.user_id,
                            user: users[req.session.user_id]};
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
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  users[userID] = { id: userID,
                    email: req.body.email,
                    password: hashedPassword};
  req.session.user_id = userID;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const key = generateRandomString();
  const user_id = req.session.user_id;
  urlDatabase[key] = {'userID': '', 'longURL': ''};
  urlDatabase[key]['userID'] = user_id;
  urlDatabase[key]['longURL'] = req.body.longURL;
  console.log(urlDatabase);
  let templateVariables = { urls: urlDatabase,
                            shortURL: key,
                            user_id: req.session.user_id};
  res.redirect(`/urls/${key}`);
});

app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id){
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.send("You can't delete this URL");
  }
});

app.post("/login", (req, res) => {
  for (user in users){
    if (users[user]['email'] === req.body.email){
      if (bcrypt.compareSync(req.body.password, users[user]['password'])){
        req.session.user_id  = users[user]['id'];
        res.redirect('/urls');
      } else {
        res.status(403).send("Password was inputed incorrectly");
      }
    }
  }
});

app.get("/login", (req, res) => {
  var templateVariables = {user: users[req.session.user_id],
                          user_id: req.session.user_id};
  res.render("urls_login", templateVariables);
});

app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id){
    urlDatabase[req.params.id]['longURL'] = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.send("You can't edit this URL");
    res.redirect(`/urls/${req.params.id}`);
  }
});

app.get('/urls/:id', (req, res) => {
  let templateVariables = { urls: urlDatabase,
                            shortURL: req.params.id,
                            user: users[req.session.user_id],
                            user_id: req.session.user_id};
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
