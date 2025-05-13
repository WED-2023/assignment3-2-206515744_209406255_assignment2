const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `INSERT INTO FavoriteRecipes (user_id, recipe_id) VALUES (?, ?)`,
    [user_id, recipe_id]
  );
}
async function removeRecipeFromFavorites(user_id, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM FavoriteRecipes WHERE user_id = ? AND recipe_id = ?`,
    [user_id, recipe_id]
  );
}

async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `SELECT recipe_id FROM FavoriteRecipes WHERE user_id = ?`,
    [user_id]
  );
  return recipes_id;
}
async function addRecipeForUser(user_id, fields) {
  const result = await DButils.execQuery(`
      INSERT INTO Recipes (
        user_id, title, image_url, prep_time_minutes, servings,
        ingredients, instructions,likes, is_vegan, is_gluten_free
      ) VALUES (
        '${user_id}', '${fields.title}', '${fields.image_url}', '${
    fields.prep_time_minutes
  }', '${fields.servings}',
        '${JSON.stringify(fields.ingredients)}', '${JSON.stringify(
    fields.instructions
  )}',0,
          '${fields.is_vegan ? 1 : 0}', '${fields.is_gluten_free ? 1 : 0}'      
          )
    `);
  return result.insertId;
}
async function getUserRecipes(user_id) {
  const recipes = await DButils.execQuery(
    `SELECT * FROM Recipes WHERE user_id = ?`,
    [user_id]
  );
  if (recipes.length === 0) {
    throw { status: 404, message: "No recipes found for this user" };
  }
  return recipes;
}
async function getUserRecipe(user_id, recipeId) {
  const recipe = await DButils.execQuery(
    `SELECT * FROM Recipes WHERE user_id = ? AND recipe_id = ?`,
    [user_id, recipeId]
  );
  if (recipe.length === 0) {
    throw { status: 404, message: "No recipes found for this user" };
  }
  return recipe;
}

async function removeRecipeFromDB(user_id, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM FavoriteRecipes WHERE user_id = ? AND recipe_id = ?`,
    [user_id, recipe_id]
  );
  await DButils.execQuery(
    `DELETE FROM Recipes WHERE user_id = ? AND recipe_id = ?`,
    [user_id, recipe_id]
  );
}

async function getWatchedRecipes(user_id) {
  return await DButils.execQuery(
    `SELECT recipe_id FROM WatchedRecipes WHERE user_id = ?`,
    [user_id]
  );
}
async function markAsWatched(user_id, recipe_id) {
  await DButils.execQuery(
    `INSERT INTO WatchedRecipes (user_id, recipe_id) VALUES (?, ?)`,
    [user_id, recipe_id]
  );
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.removeRecipeFromDB = removeRecipeFromDB;
exports.addRecipeForUser = addRecipeForUser;
exports.getUserRecipes = getUserRecipes;
exports.getUserRecipe = getUserRecipe;
exports.removeRecipeFromFavorites = removeRecipeFromFavorites;
exports.getWatchedRecipes = getWatchedRecipes;
exports.markAsWatched = markAsWatched;
