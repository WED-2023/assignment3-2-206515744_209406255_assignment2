require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("./routes/utils/DButils");
var cors = require("cors");
const axios = require("axios"); // for proxying external APIs

var app = express();
app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json
app.use(
  session({
    cookieName: "session", // the cookie key name
    secret: process.env.COOKIE_SECRET, // the encryption key
    duration: 24 * 60 * 60 * 1000, // expired after 20 sec
    activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
    cookie: {
      httpOnly: false,
    },
    //the session will be extended by activeDuration milliseconds
  })
);
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
//local:
app.use(express.static(path.join(__dirname, "dist")));
//remote:
// app.use(
//   express.static(path.join(__dirname, "../assignment3_3-frontend-main/dist"))
// );

app.get("/", function (req, res) {
  //remote:
  // res.sendFile(
  //   path.join(__dirname, "../assignment-3-3-frontend-main/dist/index.html")
  // );
  //local:
  res.sendFile(__dirname + "/index.html");
});
const corsConfig = {
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

app.use(cors(corsConfig)); // Enable CORS for all routes
app.options("*", cors(corsConfig)); // Preflight requests for all routes

// Proxy route to fetch countries (avoids CORS issues with external API)


var port = process.env.PORT || "3000"; //local=3000 remote=80
//#endregion
const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth = require("./routes/auth");

//#region cookie middleware
app.use(function (req, res, next) {
  console.log(req.session);
  console.log("session: ", req.session.user_id);
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users WHERE user_id = ?", [
      req.session.user_id,
    ])
      .then((users) => {
        if (users.length > 0) {
          req.user_id = req.session.user_id;
        }
        next();
      })
      .catch((error) => {
        console.error("DB error:", error);
        next();
      });
  } else {
    next();
  }
});
//#endregion

// ----> For cheking that our server is alive
app.get("/alive", (req, res) => res.send("I'm alive"));

// Routings
app.use("/users", user);
app.use("/recipes", recipes);
app.use("/", auth);

app.get("/countries", async (req, res, next) => {
  try {
    // fetch from apicountries.com
    const response = await axios.get('https://www.apicountries.com/countries');
    // extract and sort only the country names
    const countries = response.data
      .map(c => c.name)
      .sort((a, b) => a.localeCompare(b));

    // return raw data
    console.log("countries", countries);
    res.status(200).send(countries);
  } catch (error) {
    console.error("Error fetching countries:", error);

    next(error);
  }
});
// Default router
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});
module.exports = app;
