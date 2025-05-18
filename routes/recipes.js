// recipes.js
const express = require("express");
const router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

// Validate and parse `number` query parameter
async function parseNumberParam(param, defaultValue = 3) {
  const num = param ? parseInt(param, 10) : defaultValue;
  if (isNaN(num) || num < 1 || num > 10) {
    const error = new Error("'number' must be an integer between 1 and 10");
    error.status = 400;
    throw error;
  }
  return num;
}

router.get("/random", async (req, res, next) => {
  try {
    const number = await parseNumberParam(req.query.number);
    let recipes = await recipes_utils.getRandomRecipeDetails(number);
    recipes = await recipes_utils.enrichRecipesWithUserInfo(req.session.user_id, recipes);
    return res.status(200).send(recipes);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).send({ error: true, message: error.message });
    }
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const { query, number, cuisines, diet, intolerances } = req.query;
    if (!query) {
      const error = new Error("'query' parameter is required");
      error.status = 400;
      throw error;
    }
    const params = { query, cuisines, diet, intolerances };
    const numberOfResults = [5, 10, 15].includes(Number(number)) ? Number(number) : 5;
    console.log("numberOfResults", numberOfResults);
    console.log("params", params);

    let recipes = await recipes_utils.getSearchRecipeDetails(params, numberOfResults);
    console.log("recipes", recipes);
    if (!recipes.length) {
      const error = new Error("No recipes found for the given criteria");
      error.status = 404;
      throw error;
    }
    recipes = await recipes_utils.enrichRecipesWithUserInfo(req.session.user_id, recipes);
    console.log("enriched recipes", recipes);
    return res.status(200).send(recipes);
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).send({ error: true, message: error.message });
    }
    next(error);
  }
});

router.get("/:recipe_id", async (req, res, next) => {
  try {
    const { recipe_id } = req.params;
    const full = req.query.full === 'true';
    console.log("recipe_id", recipe_id);
    console.log("full", full);
    const recipe = full
      ? await recipes_utils.getFullRecipeDetails(recipe_id)
      : await recipes_utils.getRecipeDetails(recipe_id);
    console.log("recipe", recipe);
    let recipes = [recipe];
    recipes = await recipes_utils.enrichRecipesWithUserInfo(req.session.user_id, recipes);
    return res.status(200).send(recipes[0]);
  } catch (error) {
    next(error);
  }
});

// Global error handler
router.use((err, req, res, next) => {
  const status = err.status || 500;
  return res.status(status).send({ error: true, message: err.message });
});

module.exports = router;