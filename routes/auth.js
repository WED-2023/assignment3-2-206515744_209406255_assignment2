var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
    // username exists
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
    };
    let users = [];
    users = await DButils.execQuery("SELECT username from users");

    if (users.find((x) => x.username === user_details.username))
      return res.status(409).send({ message: "Username taken", error: true });

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

    await DButils.execQuery(
      // `INSERT INTO users (username, firstname, lastname, country, password, email) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}',
      // '${user_details.country}', '${hash_password}', '${user_details.email}')`
      "INSERT INTO users(username, firstname, lastname, country, password, email) VALUES (?, ?, ?, ?, ?, ?)",
      [
        user_details.username,
        user_details.firstname,
        user_details.lastname,
        user_details.country,
        hash_password,
        user_details.email,
      ]
    );
    return res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    if (req.session.user_id) {
      return res.status(400).send({
        message: "You are already logged in",
        error: true,
      });
    }
    // check that username exists
    const users = await DButils.execQuery(
      "SELECT * FROM users where username=?",
      [req.body.username]
    );
    if (users.length === 0) {
      return res.status(401).send({
        message: "Username or Password incorrect",
        error: true,
      });
    }
    // check that the password is correct
    // const user = users.find((u) => u.username === req.body.username);
    const user = users[0];
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      return res.status(401).send({
        message: "Username or Password incorrect",
        error: true,
      });
    }

    // Set cookie
    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    // return cookie
    return res.status(202).send({ message: "login succeeded ", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res, next) {
  try {
    if (!req.session.user_id) {
      return res.status(401).send({
        message: "You are not logged in",
        error: true,
      });
    }
    console.log("session user_id Logout: " + req.session.user_id);
    req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
    return res.status(200).send({ success: true, message: "logout succeeded" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
