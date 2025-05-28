const express = require("express");
const router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

// Authentication middleware
router.use(async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    if (!user_id) {
      throw {status: 401, message: "Unauthorized"};
    }
    const users = await DButils.execQuery(
      "SELECT user_id FROM users WHERE user_id = ?",
      [user_id]
    );
    if (users.length === 0) {
      throw {status: 401, message: "User not found"};
    }
    req.user_id = user_id;
    next();
  } catch (err) {
    next(err);
  }
});
// POST /users/liked
router.post("/liked", async (req, res, next) => {
  try {
    const recipe_id  = req.body.recipe_id;
    const user_id = req.user_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {status: 400, message: "Missing recipe_id"};
    }
    try {
      await recipe_utils.getRecipeInformation(recipe_id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw {
          status: 404,
          message: `Recipe ${recipe_id} not found.`,
        };
      }
    }
    const isLiked = await user_utils.isRecipeLiked(user_id, recipe_id);
    if (isLiked) {
      throw {
        status: 400,
        message: `Recipe ${recipe_id} is already liked.`,
      };
    }
    await user_utils.markAsLiked(user_id, recipe_id);
    res
      .status(201)
      .send({ message: `Recipe ${recipe_id} liked`, success: true });
  } catch (err) {
    next(err);
  }
});
// GET /users/liked
router.get("/liked", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const LikedIds = await user_utils.getLikedRecipes(user_id);
    const recipes = await recipe_utils.getRecipesDetails(LikedIds);
    // Enrich with viewed and favorite flags
    for (const recipe of recipes) {
      recipe.viewed = await user_utils.isRecipeViewed(user_id, recipe.id);
      recipe.spoonacularScore = recipe.spoonacularScore + 1;
    }
    res.status(200).send(recipes);
  } catch (err) {
    next(err);
  }
});

// DELETE /users/liked
router.delete("/liked", async (req, res, next) => {
  try {
    const recipe_id  = req.body.recipe_id;
    const user_id = req.user_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {
        status: 400,
        message: "Missing recipe_id",
      };
    }
    const isLiked = await user_utils.isRecipeLiked(user_id, recipe_id);
    if (!isLiked) {
      throw {
        status: 404,
        message: `Recipe ${recipe_id} not Liked.`,
      };
    }
    await user_utils.deleteUserLiked(user_id, recipe_id);
    res
      .status(200)
      .send({ message: `Recipe ${recipe_id} removed from Liked`, success: true });
  } catch (err) {
    next(err);
  }
});



// POST /users/favorites
router.post("/favorites", async (req, res, next) => {
  try {
    const recipe_id  = req.body.recipe_id;
    const user_id = req.user_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {status: 400, message: "Missing recipe_id"};
    }
    try {
      await recipe_utils.getRecipeInformation(recipe_id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw {
          status: 404,
          message: `Recipe ${recipe_id} not found.`,
        };
      }
    }
    const isFavorite = await user_utils.isRecipeFavorite(user_id, recipe_id);
    if (isFavorite) {
      throw {
        status: 400,
        message: `Recipe ${recipe_id} is already in favorites.`,
      };
    }
    await user_utils.markAsFavorite(user_id, recipe_id);
    res
      .status(201)
      .send({ message: `Recipe ${recipe_id} added to favorites`, success: true });
  } catch (err) {
    next(err);
  }
});

// GET /users/favorites
router.get("/favorites", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const favoriteIds = await user_utils.getFavoriteRecipes(user_id);
    const recipes = await recipe_utils.getRecipesDetails(favoriteIds);
    // Enrich with viewed and favorite flags
    for (const recipe of recipes) {
      recipe.viewed = await user_utils.isRecipeViewed(user_id, recipe.id);
      recipe.favorite = true;
    }
    res.status(200).send(recipes);
  } catch (err) {
    next(err);
  }
});

// DELETE /users/favorites
router.delete("/favorites", async (req, res, next) => {
  try {
    const recipe_id  = req.body.recipe_id;
    const user_id = req.user_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {
        status: 400,
        message: "Missing recipe_id",
      };
    }
    const isFavorite = await user_utils.isRecipeFavorite(user_id, recipe_id);
    if (!isFavorite) {
      throw {
        status: 404,
        message: `Recipe ${recipe_id} not in favorites.`,
      };
    }
    await user_utils.deleteUserFavorite(user_id, recipe_id);
    res
      .status(200)
      .send({ message: `Recipe ${recipe_id} removed from favorites`, success: true });
  } catch (err) {
    next(err);
  }
});

// POST /users/last-view
router.post("/last-view", async (req, res, next) => {
  try {
    const recipe_id  = req.body_recipe_id;
    const user_id = req.user_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {
        status: 400,
        message: "Missing recipe_id",
      };
     
    }
    try {
      await recipe_utils.getRecipeInformation(recipe_id);
    } catch (error) {
      if (error.response?.status === 404) {
        throw {
          status: 404,
          message: `Recipe ${recipe_id} not found.`,
        };
       
      }
      throw error;
    }
    if (await user_utils.isRecipeViewed(user_id, recipe_id)) {
      await user_utils.deleteLastViewed(user_id, recipe_id);
    }
    await user_utils.addLastViewed(user_id, recipe_id);
    res
      .status(201)
      .send({ message: "Recipe saved to last-viewed", success: true });
  } catch (err) {
    next(err);
  }
});

// GET /users/last-view
router.get("/last-view", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.number, 10) || 3;
    const user_id = req.user_id;
    const viewedIds = await user_utils.getLastViewed(user_id, limit);
    const recipes = await recipe_utils.getRecipesDetails(viewedIds);
    for (const recipe of recipes) {
      recipe.viewed = true;
      recipe.favorite = await user_utils.isRecipeFavorite(user_id, recipe.id);
    }
    res.status(200).send(recipes);
  } catch (err) {
    next(err);
  }
});

// POST /users/my-recipes
router.post("/my-recipes", async (req, res, next) => {
  try {
    const user_id = req.user_id;
    const recipe = req.body;
    // add recipe
    const recipeDetails = {
      ...recipe,
      vegan: recipe.vegan ? 1 : 0,
      vegetarian: recipe.vegetarian ? 1 : 0,
      glutenFree: recipe.glutenFree ? 1 : 0,
    };
    const recipe_id = await user_utils.addUserRecipe(user_id, recipeDetails);
    await user_utils.addIngredients(user_id, recipe_id, recipe.ingredients);
    await user_utils.addInstructions(user_id, recipe_id, recipe.instructions);
    await user_utils.addEquipments(user_id, recipe_id, recipe.equipment);
    
    res
      .status(201)
      .send({ message: `Recipe ${recipe_id} added to user recipes`, success: true });
  } catch (err) {
    next(err);
  }
});

// GET /users/my-recipes
router.get("/my-recipes", async (req, res, next) => {
  try {
    const recipes = await user_utils.getUserRecipes(req.user_id);
    res.status(200).send(recipes);
  } catch (err) {
    next(err);
  }
});

// GET /users/my-recipes/:recipe_id
router.get("/my-recipes/:recipe_id", async (req, res, next) => {
  try {
    const recipe_id = req.params.recipe_id;
    const recipe = await user_utils.getUserSpecificRecipe(
      req.user_id,
      recipe_id
    );
    res.status(200).send(recipe);
  } catch (err) {
    next(err);
  }
});

// DELETE /users/my-recipes
router.delete("/my-recipes", async (req, res, next) => {
  try {
    const  recipe_id  = req.body.recipe_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {
        status: 400,
        message: "Missing recipe_id",
      };
    }
    await user_utils.deleteUserRecipe(req.user_id, recipe_id);
    return res
      .status(200)
      .send({ message: `Recipe ${recipe_id} removed from user recipes`, success: true });
  } catch (err) {
    next(err);
  }
});

// GET /users/meal-plan
router.get("/meal-plan", async (req, res, next) => {
  try {
    const plan = await user_utils.getMealPlan(req.user_id);
    res.status(200).send(plan);
  } catch (err) {
    next(err);
  }
});

// POST /users/meal-plan
router.post("/meal-plan", async (req, res, next) => {
  try {
    const recipe_id  = req.body.recipe_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {
        status: 400,
        message: "Missing recipe_id",
      };
    }
    await user_utils.addMealPlan(req.user_id, recipe_id);
    res
      .status(200)
      .send({ message: `Recipe ${recipe_id} added to meal plan`, success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/meal-plan
router.delete("/meal-plan", async (req, res, next) => {
  try {
    const  recipe_id  = req.body.recipe_id;
    if (recipe_id === undefined || recipe_id === null) {
      throw {
        status: 400,
        message: "Missing recipe_id",
      };
    }
    await user_utils.deleteMealPlan(req.user_id, recipe_id);
    res
      .status(200)
      .send({ message: `Recipe ${recipe_id} removed from meal plan`, success: true });
  } catch (err) {
    next(err);
  }
});

// GET /users/family-recipes
router.get("/family-recipes", async (req, res, next) => {
  try {
    const familyRecipes = await user_utils.getFamilyRecipes(req.user_id);
    res.status(200).send(familyRecipes);
  } catch (err) {
    next(err);
  }
});

// POST /users/family-recipes
router.post("/family-recipes", async (req, res, next) => {
  try {
    const { family_member, occasion, ingredients, instructions, image } =
      req.body;
    if (!family_member || !occasion || !ingredients || !instructions) {
      throw {
        status: 400,
        message: "Missing required fields",
      };
    }
    const familyrecipe_id=await user_utils.addFamilyRecipe(
      req.user_id,
      family_member,
      occasion,
      ingredients,
      instructions,
      image
    );
    res
      .status(201)
      .send({ message: `Family recipe ${familyrecipe_id}  added`, success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/family-recipes
router.delete("/family-recipes", async (req, res, next) => {
  try {
    const familyrecipe_id  = req.body_recipe_id;
    if (familyrecipe_id === undefined || familyrecipe_id === null) {
      throw {
        status: 400,
        message: "Missing familyrecipe_id",
      };
    }
    await user_utils.deleteFamilyRecipe(req.user_id, familyrecipe_id);
    res
      .status(200)
      .send({ message: `Family recipe ${familyrecipe_id} removed`, success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
