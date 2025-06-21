// recipes.js
const express = require("express");
const router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

// Validate and parse `number` query parameter
async function parseNumberParam(param, defaultValue = 3) {
  const num = param ? parseInt(param, 10) : defaultValue;
  if (isNaN(num) || num < 1 || num > 10) {
    throw {
      status: 400,
      message: "'number' must be an integer between 1 and 10",
    };
  }
  return num;
}

router.get("/random", async (req, res, next) => {
  try {
    const number = await parseNumberParam(req.query.number);
    let recipes = await recipes_utils.getRandomRecipeDetails(number);
    recipes = await recipes_utils.enrichRecipesWithUserInfo(
      req.session.user_id,
      recipes
    );
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { query, number, cuisines, diet, intolerances } = req.query;
    if (!query) {
      throw {
        status: 400,
        message: "'query' parameter is required",
      };
    }
    const params = { query, cuisines, diet, intolerances };
    const numberOfResults = [5, 10, 15].includes(Number(number))
      ? Number(number)
      : 5;
    console.log("numberOfResults", numberOfResults);
    console.log("params", params);

    let recipes = await recipes_utils.getSearchRecipeDetails(
      params,
      numberOfResults
    );
    console.log("recipes", recipes);
    if (!recipes.length) {
      throw {
        status: 404,
        message: "No recipes found for the given criteria",
      };
    }
    recipes = await recipes_utils.enrichRecipesWithUserInfo(
      req.session.user_id,
      recipes
    );
    console.log("enriched recipes", recipes);
    res.status(200).send(recipes);
  } catch (error) {
    next(error);
  }
});

router.get("/:recipe_id", async (req, res, next) => {
  try {
    const { recipe_id } = req.params;
    const full = req.query.full === "true";
    console.log("recipe_id", recipe_id);
    console.log("full", full);
    const recipe = full
      ? await recipes_utils.getFullRecipeDetails(recipe_id)
      : await recipes_utils.getRecipeDetails(recipe_id);
    console.log("recipe", recipe);
    let recipes = [recipe];
    recipes = await recipes_utils.enrichRecipesWithUserInfo(
      req.session.user_id,
      recipes
    );
    res.status(200).send(recipes[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/:recipe_id/preparation", async (req, res, next) => {
  try {
    const { recipe_id } = req.params;
    const user_id = req.session.user_id;
    const prep = await recipes_utils.getRecipePreparationDetails(
      recipe_id,
      user_id
    );
    res.status(200).send(prep);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
