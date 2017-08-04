/*
** Input:
** Output: Returns a random alpha-numeric string of length 6
*/
function generateRandomString() {
  var randomString = "";
  var charset = "ABCDEFGHIJKLMNOPQESTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++){
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return randomString;
}

module.exports = generateRandomString;

