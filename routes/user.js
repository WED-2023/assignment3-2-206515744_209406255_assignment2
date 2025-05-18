var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");
const { add } = require("nodemon/lib/rules");
const { check } = require("express-validator");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM Users where user_id = ?", [
      req.session.user_id,
    ])
      .then((users) => {
        if (users.length > 0) {
          req.user_id = req.session.user_id;
          next();
        } else {
          return res.status(401).send({
            error: true,
            message: "User not found",
          });
        }
      })
      .catch((err) => next(err));
  } else {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
});

router.post("/favorites", async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await recipe_utils.getRecipeInformation(recipe_id).catch((error) => {
      // check if recipe id exist on spoon
      if (error.response && error.response.status === 404)
        return res.status(404).send({
          error: true,
          message: `A recipe with the id ${recipe_id} does not exist.`,
        });
      else throw error;
    });

    const result = await checkIfFavorite(user_id, recipe_id);
    if (result === true)
      return res.status(400).send({
        error: true,
        message: `A recipe with the id ${recipe_id} already saved as favorite for ${user_id}.`,
      });

    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send({
      success: true,
      message: "The Recipe successfully saved to favorites",
    });
  } catch (error) {
    next(error);
  }
});

/*
=======

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get("/favorites", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesDetails(recipes_id_array);
    for (let recipe of results) {
      recipe.viewed = await user_utils.checkIfViewed(
        req.session.user_id,
        recipe.id
      );
      recipe.favorite = true;
    }
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});
/*
Deletes From user's favorites
*/
router.delete("/favorites", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await user_utils.deleteUserFavorite(user_id, recipe_id);
    res
      .status(200)
      .send({
        success: true,
        message: "The Recipe successfully deleted from user's favorites",
      });
  } catch (error) {
    next(error);
  }
});

/**
 * This path gets body with recipe_id and save this recipe in the favorites list of the logged-in user
 */
router.post("/last-view", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await recipe_utils.getRecipeInformation(recipe_id).catch((error) => {
      // check if recipe id exist on spoon
      if (error.response && error.response.status === 404)
        throw {
          status: 404,
          message: `A recipe with the id ${recipe_id} does not exist.`,
        };
      else throw error;
    });

    const result = await user_utils.checkIfViewed(user_id, recipe_id);
    /*
    The user viewed this page and needed to refresh
    */
    if (result === true) {
      await user_utils.deleteLastViewed(user_id, recipe_id);
    }

    await user_utils.addLastViewed(user_id, recipe_id);

    return res
      .status(201)
      .send({
        success: true,
        message: "The Recipe successfully saved to last-viewed",
      });
  } catch (error) {
    console.log("error in last view");
    next(error);
  }
});
/*
Gets user's last viewed by number of viewes or defualt 3
*/
router.get("/last-view", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const number = parseInt(req.query.number) || 3;
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getLastViewed(user_id, number);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesDetails(recipes_id_array);
    for (let recipe of results) {
      recipe.viewed = true;
      recipe.favorite = await user_utils.checkIfFavorite(
        req.session.user_id,
        recipe.id
      );
    }
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});
/*
Add user's last view
*/
router.post("/my-recipes", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    console.log(req.body);
    let recipe_details = {
      image: req.body.image,
      title: req.body.title,
      readyInMinutes: req.body.readyInMinutes,
      popularity: 0,
      vegan: req.body.vegan,
      vegetarian: req.body.vegetarian,
      glutenFree: req.body.glutenFree,
      ingredients: req.body.ingredients,
      instructions: req.body.instructions,
      numberOfPortions: req.body.numberOfPortions,
      equipment: req.body.equipment,
      summary: req.body.summary,
    };

    const user_id = req.session.user_id;

    recipe_details.vegan = req.body.vegan ? 1 : 0;
    recipe_details.vegetarian = req.body.vegetarian ? 1 : 0;
    recipe_details.glutenFree = req.body.glutenFree ? 1 : 0;

    const recipe_id = await user_utils.addUserRecipe(user_id, recipe_details);

    await user_utils.addIngredients(
      user_id,
      recipe_id,
      recipe_details.ingredients
    );

    console.log(recipe_details.instructions);
    await user_utils.addInstructions(
      user_id,
      recipe_id,
      recipe_details.instructions
    );

    // Add all the equipments
    await user_utils.addEquipments(
      user_id,
      recipe_id,
      recipe_details.equipment
    );
    res.status(201).send({ message: "Recipe has been added", success: true });
  } catch (error) {
    next(error);
  }
});
/*
Get user's own recipes
*/
router.get("/my-recipes", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const results = await user_utils.getUserRecipes(user_id);
    console.log(results);
    return res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});
/*
Get user's Specific Recipe
*/
router.get("/my-recipes/:recipe_id", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.params.recipe_id;
    const result = await user_utils.getUserSpecificRecipe(user_id, recipe_id);
    console.log(result);
    return res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});
/*
Delete user's own recipes
*/
router.delete("/my-recipes", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await user_utils.deleteUserRecipe(user_id, recipe_id);
    return res.status(200).send({
      success: true,
      message: "The Recipe successfully deleted from user's recieps",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/meal-plan", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const meal_plan = await user_utils.getMealPlan(user_id);
    return res.status(200).send(meal_plan);
  } catch (error) {
    next(error);
  }
});

router.post("/meal-plan", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await user_utils.addMealPlan(user_id, recipe_id);
    return res.status(200).send({
      success: true,
      message: "The Recipe successfully added to meal plan",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/meal-plan", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipe_id;
    await user_utils.deleteMealPlan(user_id, recipe_id);
    return res.status(200).send({
      success: true,
      message: "The Recipe successfully deleted from meal plan",
    });
  } catch (error) {
    next(error);
  }
});

router.get("/family-recipes", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const family_recipes = await user_utils.getFamilyRecipes(user_id);
    return res.status(200).send(family_recipes);
  } catch (error) {
    next(error);
  }
});

router.post("/family-recipes", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.user_id;
    const family_member = req.body.family_member;
    const occasion = req.body.occasion;
    const ingredients = req.body.ingredients;
    const instructions = req.body.instructions;
    const image = req.body.image;
    await user_utils.addFamilyRecipe(
      user_id,
      family_member,
      occasion,
      ingredients,
      instructions,
      image
    );
    return res.status(201).send({
      success: true,
      message: "The Recipe successfully added to family recipes",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/family-recipes", async (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).send({
      error: true,
      message: "User not logged in",
    });
  }
  try {
    const user_id = req.session.id;
    const recipe_id = req.body.recipe_id;
    await user_utils.deleteFamilyRecipe(user_id, recipe_id);
    return res.status(200).send({
      success: true,
      message: "The Recipe successfully deleted from family recipes",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
