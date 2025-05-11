var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
const { add } = require("nodemon/lib/rules");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM Users")
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
    const id = await user_utils.addRecipeForUser(user_id, fields);

    res
      .status(201)
      .send({ message: `Recipe with id ${id} created successfully` });
    console.log(`Recipe ${id} created successfully`);
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
    const recipes = await user_utils.getUserRecipes(user_id);
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
 * this gets a specific recipe of the logged-in user
 */
router.get("/recipes/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipeId = req.params.recipeId;
    const recipe = await user_utils.getUserRecipe(user_id, recipeId);
    if (recipe.length === 0) {
      throw {
        status: 404,
        message: "No recipes found for this user",
      };
    }
    res.status(200).json(recipe[0]);
  } catch (err) {
    next(err);
  }
});
router.delete("/recipes/:recipeId", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipeId = req.params.recipeId;
    await user_utils.removeRecipeFromDB(user_id, recipeId);
    res
      .status(200)
      .send({ message: `Recipe with id ${recipeId} deleted successfully` });
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
