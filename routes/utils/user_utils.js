const DButils = require("./DButils");

async function getUserIDFromUsername(username) {
  return DButils.execQuery("SELECT user_id FROM users WHERE username = ?", [
    username,
  ]);
}

async function markAsFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    "INSERT INTO FavoriteRecipes (user_id, recipe_id) VALUES (?, ?)",
    [user_id, recipe_id]
  );
}

async function deleteUserFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    "DELETE FROM FavoriteRecipes WHERE user_id = ? AND recipe_id = ?",
    [user_id, recipe_id]
  );
}

async function getFavoriteRecipes(user_id) {
  return DButils.execQuery(
    "SELECT recipe_id FROM FavoriteRecipes WHERE user_id = ?",
    [user_id]
  );
}

async function checkIfFavorite(userId, recipeId) {
  const result = await DButils.execQuery(
    "SELECT 1 FROM FavoriteRecipes WHERE user_id = ? AND recipe_id = ? LIMIT 1",
    [userId, recipeId]
  );
  return result.length > 0;
}

async function getLastViewed(user_id, number = 3) {
  // MySQL supports placeholders in LIMIT when using the mysql2 driver.
  return DButils.execQuery(
    "SELECT * FROM lastviewed WHERE user_id = ? ORDER BY added_timestamp DESC LIMIT ?",
    [user_id, Number(number)]
  );
}

async function checkIfViewed(userId, recipeId) {
  const result = await DButils.execQuery(
    "SELECT 1 FROM lastviewed WHERE user_id = ? AND recipe_id = ? LIMIT 1",
    [userId, recipeId]
  );
  return result.length > 0;
}

async function addLastViewed(user_id, recipe_id) {
  await DButils.execQuery(
    "INSERT INTO lastviewed (user_id, recipe_id) VALUES (?, ?)",
    [user_id, recipe_id]
  );
}

async function deleteLastViewed(user_id, recipe_id) {
  await DButils.execQuery(
    "DELETE FROM lastviewed WHERE user_id = ? AND recipe_id = ?",
    [user_id, recipe_id]
  );
}

async function addUserRecipe(
  user_id,
  recipe_id,
  title,
  image,
  time,
  popularity,
  vegan,
  glutenFree,
  numberOfPortions,
  summary
) {
  await DButils.execQuery(
    `INSERT INTO myrecipes 
      (user_id, recipe_id, title, image, time, popularity, vegan, glutenFree, number_of_portions, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      recipe_id,
      title,
      image,
      time,
      popularity,
      vegan,
      glutenFree,
      numberOfPortions,
      summary,
    ]
  );
}

async function addIngredients(
  user_id,
  recipe_id,
  ingredient_number,
  name,
  amount,
  unit,
  description
) {
  await DButils.execQuery(
    `INSERT INTO recipe_ingredients 
      (user_id, recipe_id, ingredient_number, name, amount, unit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_id, recipe_id, ingredient_number, name, amount, unit, description]
  );
}

async function addInstrucitons(
  user_id,
  recipe_id,
  instruction_number,
  instruction
) {
  await DButils.execQuery(
    `INSERT INTO recipe_instructions 
      (user_id, recipe_id, instruction_number, instruction)
      VALUES (?, ?, ?, ?)`,
    [user_id, recipe_id, instruction_number, instruction]
  );
}

async function addEquipments(user_id, recipe_id, equipment_number, equipment) {
  await DButils.execQuery(
    `INSERT INTO recipe_equipments 
      (user_id, recipe_id, equipment_number, equipment)
      VALUES (?, ?, ?, ?)`,
    [user_id, recipe_id, equipment_number, equipment]
  );
}

async function getUserRecipes(user_id) {
  const user_recipes = await DButils.execQuery(
    "SELECT * FROM myrecipes WHERE user_id = ?",
    [user_id]
  );

  const recipes = [];
  for (const user_recipe of user_recipes) {
    const recipe = await getMyRecipeDetails(
      user_id,
      user_recipe.recipe_id,
      user_recipe
    );
    recipes.push(recipe);
  }
  return recipes;
}

async function getUserSpecificRecipe(user_id, recipe_id) {
  const user_recipe = await DButils.execQuery(
    "SELECT * FROM myrecipes WHERE user_id = ? AND recipe_id = ?",
    [user_id, recipe_id]
  );
  return getMyRecipeDetails(user_id, recipe_id, user_recipe[0]);
}

async function getMyRecipeDetails(user_id, user_recipe_id, user_recipe) {
  const equipments = await DButils.execQuery(
    `SELECT * FROM recipe_equipments 
      WHERE user_id = ? AND recipe_id = ?
      ORDER BY equipment_number`,
    [user_id, user_recipe_id]
  );

  const ingredients = await DButils.execQuery(
    `SELECT * FROM recipe_ingredients 
      WHERE user_id = ? AND recipe_id = ?
      ORDER BY ingredient_number`,
    [user_id, user_recipe_id]
  );

  const instructions = await DButils.execQuery(
    `SELECT * FROM recipe_instructions 
      WHERE user_id = ? AND recipe_id = ?
      ORDER BY instruction_number`,
    [user_id, user_recipe_id]
  );

  return {
    id: user_recipe_id,
    title: user_recipe.title,
    image: user_recipe.image,
    readyInMinutes: user_recipe.time,
    aggregateLikes: user_recipe.popularity,
    vegan: user_recipe.vegan,
    glutenFree: user_recipe.glutenFree,
    ingredients: ingredients.map((i) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      description: i.description,
    })),
    instructions: instructions.map((ins) => ins.instruction),
    numberOfPortions: user_recipe.number_of_portions,
    equipment: equipments.map((e) => e.equipment),
  };
}

async function deleteUserRecipe(user_id, recipe_id) {
  await DButils.execQuery(
    "DELETE FROM myrecipes WHERE user_id = ? AND recipe_id = ?",
    [user_id, recipe_id]
  );
}

module.exports = {
  getUserIDFromUsername,
  markAsFavorite,
  deleteUserFavorite,
  getFavoriteRecipes,
  checkIfFavorite,
  getLastViewed,
  checkIfViewed,
  addLastViewed,
  deleteLastViewed,
  addUserRecipe,
  addIngredients,
  addInstrucitons,
  addEquipments,
  getUserRecipes,
  getUserSpecificRecipe,
  deleteUserRecipe,
};
