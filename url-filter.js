/*
 * Input: a user id
 * Output: A new database object with only the user's urls
 */
function urlsForUser(id, urlDatabase){
  let newURLs = {};
  for (urlItem in urlDatabase){
    if (urlDatabase[urlItem]['userID'] === id){
      newURLs[urlItem] = urlDatabase[urlItem];
    }
  }
  return newURLs;
}

module.exports = urlsForUser;
