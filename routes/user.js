var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
          next();
        }
      })
      .catch((err) => next(err));
  } else {
    res.sendStatus(401);
  }
});
/**
 * this creates a recipe for the logged-in user
 */
router.post("/recipes", async (req, res, next) => {
  try {
  
    const user_id = req.session.user_id;
    const {
      title,
      image_url,
      prep_time_minutes,
      ingredients,
      instructions,
      is_vegan,
      is_gluten_free,
      servings,
      is_favorite = false,
    } = req.body;

    const fields = {
      title,
      image_url,
      prep_time_minutes,
      servings,
      ingredients,
      instructions,
      is_vegan,
      is_gluten_free,
      is_favorite,
    };
    if (
      Object.values(fields).some(
        (field) => field === undefined || field === null || field === ""
      )
    ) {
      throw {
        status: 400,
        message: "All fields are required and must not be empty.",
      };
    }

    await DButils.execQuery(`
      INSERT INTO recipes (
        user_id, title, image_url, prep_time_minutes, servings,
        ingredients, instructions, is_vegan, is_gluten_free, is_favorite
      ) VALUES (
        '${user_id}', '${title}', '${image_url}', '${prep_time_minutes}', '${servings}',
        '${JSON.stringify(ingredients)}', '${JSON.stringify(instructions)}',
          '${is_vegan ? 1 : 0}', '${is_gluten_free ? 1 : 0}', '${is_favorite ? 1 : 0}'      
          )
    `);
    res.status(201).send({ message: "Recipe created successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * this gets all the recipes of the logged-in user
 */
router.get("/recipes", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipes = await DButils.execQuery(`
      SELECT *
      FROM recipes WHERE user_id=${user_id}
    `);
    if (recipes.length === 0) {
      throw {
        status: 404,
        message: "No recipes found for this user",
      };
    }
    res.status(200).json(recipes);
  } catch (err) {
    next(err);
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get("/favorites", async (req, res, next) => {
  try {
    res.send("Im Alive");
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
