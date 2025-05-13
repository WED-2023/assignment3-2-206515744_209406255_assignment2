var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");

router.get("/", (req, res) => res.send("im here"));

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/random", async (req, res, next) => {
  let number=3;
  try {
    if (req.query.number) {
      num = req.query.number;
      if (num > 10 || num < 1)
        throw { status: 400, message: "number must be between 1 and 10." };
      number = req.query.number;
    }
    res.locals.recipes = await recipes_utils.getRandomRecipeDetails(number);
    await addViewedInfo(req, res, next);
  } catch (error) {
    next(error);
  }
});
/**
 * This path returns a full details of a recipe by its id if full = true or else return preview
 */
router.get("/search", async (req, res, next) => {
  try {
    let { query, number, cuisines, diet, intolerances } = req.query;

    if (!query) throw { status: 400, message: "must be a query for search." };

    let numberOfResults = 5;
    let numbers = ["5", "10", "15"];

    if (number) {
      if (!numbers.includes(number))
        throw { status: 400, message: "n must be equal to 5,10 or 15." };

      numberOfResults = number;
    }

    let params = {
      query: req.query.query,
    };

    if (cuisines) params.cuisines = cuisines;
    if (diet) params.diet = diet;
    if (intolerances) params.intolerances = intolerances;

    res.locals.recipes = await recipes_utils.getSearchRecipeDetails(
      params,
      numberOfResults
    );
    await addViewedInfo(req, res, next);

  } catch (error) {
    next(error);
  }
});

router.get("/:recipeId", async (req, res, next) => {
  try {
    if (req.query.full) {
      res.locals.recipes = [
        await recipes_utils.getFullRecipeDetails(req.params.recipeId),
      ];
      await addViewedInfo(req, res, next);
    }
    else{
    res.locals.recipes = [
      await recipes_utils.getRecipeDetails(req.params.recipeId),
    ];
    await addViewedInfo(req, res, next);
  }
  } catch (error) {
    next(error);
  }
});

async function addViewedInfo(req, res, next) {
  try {
    if (req.session && req.session.user_id) {
      // User is logged in, check if recipes were viewed or in his favorites
      for (let recipe of res.locals.recipes) {
        recipe.viewed = await user_utils.checkIfViewed(
          req.session.user_id,
          recipe.id
        );
        recipe.favorite = await user_utils.checkIfFavorite(
          req.session.user_id,
          recipe.id
        );
      }
    }
    // Send the response
    res.status(200).send(res.locals.recipes);
  } catch (error) {
    next(error);
  }
}

router.use((err, req, res, next) => {
  res.status(500).send({ error: err.toString() });
  console.log(err.toString());
});

module.exports = router;
