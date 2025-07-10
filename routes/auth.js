var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res, next) => {
  try {
    // Debug: Log what we received
    console.log("=== REGISTER DEBUG ===");
    console.log("Request body:", {
      ...req.body,
      password: req.body.password ? '***' : undefined,
      confirmedPassword: req.body.confirmedPassword ? '***' : undefined
    });
    console.log("Keys in request body:", Object.keys(req.body));
    console.log("=====================");

    // collect user details, including optional profilePic
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      country: req.body.country,
      password: req.body.password,
      confirmedPassword: req.body.confirmedPassword,
      email: req.body.email,
      profilePic: req.body.profilePic, // optional URL
    };

    console.log("User details object:", {
      ...user_details,
      password: user_details.password ? '***' : undefined,
      confirmedPassword: user_details.confirmedPassword ? '***' : undefined
    });

    // Validate that passwords match
    if (user_details.password !== user_details.confirmedPassword) {
      console.log("Password validation failed:", {
        password: user_details.password ? '***' : 'MISSING',
        confirmedPassword: user_details.confirmedPassword ? '***' : 'MISSING'
      });
      throw { status: 400, message: "Passwords do not match" };
    }

    // Validate profilePic if provided
    if (user_details.profilePic) {
      try {
        new URL(user_details.profilePic);
      } catch {
        throw { status: 400, message: "Invalid profilePic URL" };
      }
    }
    // use default profilePic if none provided
    const defaultPic =
      "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg?20200418092106";
    user_details.profilePic = user_details.profilePic || defaultPic;

    let users = [];
    users = await DButils.execQuery("SELECT username from users");

    if (users.find((x) => x.username === user_details.username)) {
      throw {
        status: 409,
        message: "Username taken",
      };
    }

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

    // insert new user including profile_pic column
    await DButils.execQuery(
      "INSERT INTO users(username, firstname, lastname, country, password, email, profilePic) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        user_details.username,
        user_details.firstname,
        user_details.lastname,
        user_details.country,
        hash_password,
        user_details.email,
        user_details.profilePic,
      ]
    );
    res.status(201).send({
      message: "User created",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    if (req.session.user_id) {
      throw {
        status: 400,
        message: "You are already logged in",
      };
    }
    // check that username exists
    const users = await DButils.execQuery(
      "SELECT * FROM users where username=?",
      [req.body.username]
    );
    if (users.length === 0) {
      throw {
        status: 401,
        message: "Username or Password incorrect",
      };
    }
    // check that the password is correct
    // const user = users.find((u) => u.username === req.body.username);
    const user = users[0];
    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw {
        status: 401,
        message: "Username or Password incorrect",
      };
    }

    // Set cookie
    req.session.user_id = user.user_id;
    console.log("session user_id login: " + req.session.user_id);

    // return cookie
    res.status(200).send({
      message: "Login succeeded",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", function (req, res, next) {
  try {
    if (!req.session.user_id) {
      throw {
        status: 401,
        message: "You are not logged in",
      };
    }
    console.log("session user_id Logout: " + req.session.user_id);
    req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
    res.status(200).send({
      success: true,
      message: "Logout succeeded",
    });
  } catch (error) {
    next(error);
  }
});

// Add user information route for logged-in users
router.get("/user_information", async (req, res, next) => {
  try {
    // Ensure the user is logged in
    if (!req.session.user_id) {
      throw {
        status: 401,
        message: "You must be logged in to access user information",
      };
    }
    // Retrieve user details
    const users = await DButils.execQuery(
      "SELECT username, firstname, lastname, country, email, profilePic FROM users WHERE user_id = ?",
      [req.session.user_id]
    );
    if (users.length === 0) {
      throw { status: 404, message: "User not found" };
    }
    const { username, firstname, lastname, country, email, profilePic } =
      users[0];
    res.status(200).send({
      success: true,
      message: "User information retrieved successfully",
      data: {
        username,
        firstname,
        lastname,
        country,
        email,
        profilePic: profilePic || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
