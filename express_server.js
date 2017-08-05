// Imports
const bcrypt = require('bcrypt');
var express = require("express");
var cookieSession = require('cookie-session');
var stringGen = require('./string-gen');
var filter = require('./url-filter');
const bodyParser = require("body-parser");
var methodOverride = require('method-override');


var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

// Configure cookies
app.use(cookieSession({
  name: 'session',
  secret: "Some kind of secret here",
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.set("view engine", "ejs");


// Initializing URL database
const urlDatabase = {
  "b2xVn2": {userID: 'userRandomID', longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {userID: 'user2RandomID', longURL: "http://www.google.com"}
};

// Initializing a user database
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

/*
 * Input: GET request from /urls
 * Output: renders index page with all made urls
 */
app.get('/urls', (req, res) => {
    let templateVariables = { urls: filter(req.session.user_id, urlDatabase),
                            user: users[req.session.user_id],
                            user_id: req.session.user_id};
    res.render('urls_index', templateVariables);
});

/*
 * Input: GET request from /urls/new
 * Output: renders url creation form along with session cookies, db info
 */
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

/*
 * Input: GET request from /register
 * Output: renders registration page
 */
app.get("/register", (req, res) => {
  if (req.session.user_id){
    res.redirect('/urls');
  } else {
    let templateVariables = { urls: urlDatabase,
                              user_id: req.session.user_id,
                              user: users[req.session.user_id]};
    res.render("urls_registration", templateVariables);
  }
});

/*
 * Input: POST request from /register
 * Output: 404 if nothing entered, 400 if email in use, else hash password
 *         and redirect to main page
 */
app.post("/register", (req, res) => {
  const userID = stringGen();
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

/*
 * Input: POST request from /urls
 * Output: Add new shortURL, along with the match user_id and longURL to DB
 */
app.post("/urls", (req, res) => {
  const key = stringGen();
  const user_id = req.session.user_id;
  urlDatabase[key] = {'userID': user_id, 'longURL': req.body.longURL};
  let templateVariables = { urls: urlDatabase,
                            shortURL: key,
                            user_id: req.session.user_id};
  res.redirect(`/urls/${key}`);
});

/*
 * Input: POST request from /logout
 * Output: End session, redirect to /urls
 */
app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

/*
 * Input: DELETE request from /urls/:id/delete
 * Output: If user has ownership of url, delete and redirect to /urls,
 *         else response sends an error
 */
app.delete("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id){
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.send("You can't delete this URL");
  }
});

/*
 * Input: POST request from /login
 * Output: Check inputed email/password match DB info, if true redirect to /urls
 *         set session.user_id, else return error
 */
app.post("/login", (req, res) => {
  for (user in users){
    if (users[user]['email'] === req.body.email){
      if (bcrypt.compareSync(req.body.password, users[user]['password'])){
        req.session.user_id  = users[user]['id'];
        res.redirect('/urls');
      } else {
        res.status(403).send("Password was inputed incorrectly");
      }
      return;
    }
  }
  res.status(403).send("Email was inputed wrong");
});

/*
 * Input: GET request from /login
 * Output: Render login page
 */
app.get("/login", (req, res) => {
  if (req.session.user_id){
    res.redirect('/urls');
  } else {
    var templateVariables = {user: users[req.session.user_id],
                            user_id: req.session.user_id};
    res.render("urls_login", templateVariables);
  }
});

/*
 * Input: PUT request from /urls/:id
 * Output: Updates the longURL from req.body if user has ownership over that
 *         url, else response sends an error.
 */
app.put("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]['userID'] === req.session.user_id){
    urlDatabase[req.params.id]['longURL'] = req.body.longURL;
    res.redirect('/urls');
  } else {
    res.send("You can't edit this URL");
    res.redirect(`/urls/${req.params.id}`);
  }
});

/*
 * Input: GET request from /urls/:id
 * Output: Renders the specific show page, allows the user to update from this view
 */
app.get('/urls/:id', (req, res) => {
    if (urlDatabase[req.params.id]){
      let templateVariables = { urls: urlDatabase,
                                shortURL: req.params.id,
                                user: users[req.session.user_id],
                                user_id: req.session.user_id};
      res.render('urls_show', templateVariables);
    } else {
      res.send('Short URL does not exist!');
    }
});

/*
 * Input: GET request from /u/:shortURL
 * Output: Redirect to the longURL associated with the shortURL found urlDatabase
 */
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL].longURL){
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send("No website found with this URL");
  }
});

/*
 * Input: GET request from /urls.json
 * Output: Response returns a json of DB
 */
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/*
 * Input: port information
 * Output: Logs that the app is listening on the specified port #
 */
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
