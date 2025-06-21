// utils/user_utils.js
const DButils = require("./DButils");

//
// ——— Authentication Helpers ———
//

async function getUserIDFromUsername(username) {
  const rows = await DButils.execQuery(
    "SELECT user_id FROM users WHERE username = ?",
    [username]
  );
  return rows[0]?.user_id;
}
//
// ——— Liked ———
//

async function deleteUserLiked(userId, recipeId) {
  await DButils.execQuery(
    `DELETE FROM likedrecipes WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
}
async function getLikedRecipes(userId,recipeId){
  const rows = await DButils.execQuery(
    `SELECT recipe_id FROM likedrecipes WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => r.recipe_id);
}
async function markAsLiked(userId,recipeId){
  await DButils.execQuery(
    `INSERT INTO likedrecipes (user_id, recipe_id) VALUES (?, ?)`,
    [userId, recipeId]
  );
}
async function isRecipeLiked(userId,recipeId){
   const rows = await DButils.execQuery(
    `SELECT 1 FROM likedrecipes WHERE user_id = ? AND recipe_id = ? LIMIT 1`,
    [userId, recipeId]
  );
  return rows.length > 0;
}
//
// ——— Favorites ———
//
async function markAsFavorite(userId, recipeId) {
  await DButils.execQuery(
    `INSERT INTO favoriterecipes (user_id, recipe_id) VALUES (?, ?)`,
    [userId, recipeId]
  );
}

async function deleteUserFavorite(userId, recipeId) {
  await DButils.execQuery(
    `DELETE FROM favoriterecipes WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
}

async function getFavoriteRecipes(userId) {
  const rows = await DButils.execQuery(
    `SELECT recipe_id FROM favoriterecipes WHERE user_id = ?`,
    [userId]
  );
  // return just the IDs
  return rows.map((r) => r.recipe_id);
}

async function isRecipeFavorite(userId, recipeId) {
  const rows = await DButils.execQuery(
    `SELECT 1 FROM favoriterecipes WHERE user_id = ? AND recipe_id = ? LIMIT 1`,
    [userId, recipeId]
  );
  return rows.length > 0;
}

//
// ——— Last‐Viewed ———
//

async function getLastViewed(userId, limit = 3) {
  const rows = await DButils.execQuery(
    `SELECT recipe_id 
       FROM lastviewed 
      WHERE user_id = ? 
   ORDER BY added_timestamp DESC 
      LIMIT ?`,
    [userId, limit]
  );
  return rows.map((r) => r.recipe_id);
}

async function isRecipeViewed(userId, recipeId) {
  const rows = await DButils.execQuery(
    `SELECT 1 
       FROM lastviewed 
      WHERE user_id = ? AND recipe_id = ? 
      LIMIT 1`,
    [userId, recipeId]
  );
  return rows.length > 0;
}

async function addLastViewed(userId, recipeId) {
  await DButils.execQuery(
    `INSERT INTO lastviewed (user_id, recipe_id) VALUES (?, ?)`,
    [userId, recipeId]
  );
}

async function deleteLastViewed(userId, recipeId) {
  await DButils.execQuery(
    `DELETE FROM lastviewed WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
}

//
// ——— User‐Created Recipes ———
//

async function addUserRecipe(userId, details) {
  const result = await DButils.execQuery(
    `INSERT INTO myrecipes
       (user_id, title, image, readyInMinutes, vegan, vegetarian, glutenFree, numberOfPortions, summary)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      details.title,
      details.image,
      details.readyInMinutes,
      details.vegan ? 1 : 0,
      details.vegetarian ? 1 : 0,
      details.glutenFree ? 1 : 0,
      details.numberOfPortions,
      details.summary,
    ]
  );
  return result.insertId;
}

async function addIngredients(userId, recipeId, ingredients) {
  for (const [
    idx,
    { name, amount, unit, description },
  ] of ingredients.entries()) {
    await DButils.execQuery(
      `INSERT INTO recipeingredients 
         (user_id, recipe_id, ingredient_number, name, amount, unit, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, recipeId, idx + 1, name, amount, unit, description]
    );
  }
}

async function addInstructions(userId, recipeId, instructions) {
  for (const [idx, instruction] of instructions.entries()) {
    await DButils.execQuery(
      `INSERT INTO recipeinstructions 
         (user_id, recipe_id, instruction_number, instruction)
       VALUES (?, ?, ?, ?)`,
      [userId, recipeId, idx + 1, instruction]
    );
  }
}

async function addEquipments(userId, recipeId, equipments) {
  for (const [idx, equipment] of equipments.entries()) {
    await DButils.execQuery(
      `INSERT INTO recipeequipments 
         (user_id, recipe_id, equipment_number, equipment)
       VALUES (?, ?, ?, ?)`,
      [userId, recipeId, idx + 1, equipment]
    );
  }
}

async function getUserRecipes(userId) {
  const rows = await DButils.execQuery(
    `SELECT recipe_id, title, image, readyInMinutes, vegan, vegetarian, glutenFree
       FROM myrecipes
      WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.recipe_id,
    title: r.title,
    image: r.image,
    readyInMinutes: r.readyInMinutes,
    vegan: !!r.vegan,
    vegetarian: !!r.vegetarian,
    glutenFree: !!r.glutenFree,
  }));
}

async function getUserSpecificRecipe(userId, recipeId) {
  const rows = await DButils.execQuery(
    `SELECT * FROM myrecipes WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
  if (!rows[0]) {
    throw { status: 404, message: "Recipe not found" };
  }
  return getUserRecipeDetails(userId, recipeId, rows[0]);
}

async function getUserRecipeDetails(userId, recipeId, recipe) {
  const [equipments, ingredients, instructions] = await Promise.all([
    DButils.execQuery(
      `SELECT equipment 
         FROM recipeequipments 
        WHERE user_id = ? AND recipe_id = ? 
     ORDER BY equipment_number`,
      [userId, recipeId]
    ),
    DButils.execQuery(
      `SELECT name, amount, unit, description 
         FROM recipeingredients 
        WHERE user_id = ? AND recipe_id = ? 
     ORDER BY ingredient_number`,
      [userId, recipeId]
    ),
    DButils.execQuery(
      `SELECT instruction 
         FROM recipeinstructions 
        WHERE user_id = ? AND recipe_id = ? 
     ORDER BY instruction_number`,
      [userId, recipeId]
    ),
  ]);

  return {
    recipe_id: recipeId,
    title: recipe.title,
    image: recipe.image,
    readyInMinutes: recipe.readyInMinutes,
    vegan: !!recipe.vegan,
    vegetarian: !!recipe.vegetarian,
    glutenFree: !!recipe.glutenFree,
    numberOfPortions: recipe.numberOfPortions,
    summary: recipe.summary,
    ingredients,
    instructions: instructions.map((i) => i.instruction),
    equipment: equipments.map((e) => e.equipment),
    viewed: await isRecipeViewed(userId, recipeId),
    favorite: await isRecipeFavorite(userId, recipeId),
  };
}

async function deleteUserRecipe(userId, recipeId) {
  await DButils.execQuery(
    `DELETE FROM recipeingredients WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
  await DButils.execQuery(
    `DELETE FROM recipeinstructions WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
  await DButils.execQuery(
    `DELETE FROM recipeequipments WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
  await DButils.execQuery(
    `DELETE FROM myrecipes WHERE user_id = ? AND recipe_id = ?`,
    [userId, recipeId]
  );
}



//
// ——— Family Recipes ———
//

async function getFamilyRecipes(userId) {
  const rows = await DButils.execQuery(
    `SELECT familyrecipe_id, family_member, occasion, ingredients, instructions, image 
       FROM familyrecipes 
      WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.familyrecipe_id,
    familyMember: r.family_member,
    occasion: r.occasion,
    ingredients: JSON.parse(r.ingredients),
    instructions: JSON.parse(r.instructions),
    image: r.image,
  }));
}

async function addFamilyRecipe(
  userId,
  familyMember,
  occasion,
  ingredients,
  instructions,
  image
) {
  const result=await DButils.execQuery(
    `INSERT INTO familyrecipes 
       (user_id, family_member, occasion, ingredients, instructions, image)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      familyMember,
      occasion,
      JSON.stringify(ingredients),
      JSON.stringify(instructions),
      image,
    ]
  );
  return result.insertId;
}

async function deleteFamilyRecipe(userId, familyRecipeId) {
  await DButils.execQuery(
    `DELETE FROM familyrecipes WHERE user_id = ? AND familyrecipe_id = ?`,
    [userId, familyRecipeId]
  );
}

module.exports = {
  deleteUserLiked,
  getLikedRecipes,
  markAsLiked,
  isRecipeLiked,
  getUserIDFromUsername,
  markAsFavorite,
  deleteUserFavorite,
  getFavoriteRecipes,
  isRecipeFavorite,
  getLastViewed,
  isRecipeViewed,
  addLastViewed,
  deleteLastViewed,
  addUserRecipe,
  addIngredients,
  addInstructions,
  addEquipments,
  getUserRecipes,
  getUserSpecificRecipe,
  getUserRecipeDetails,
  deleteUserRecipe,
  getFamilyRecipes,
  addFamilyRecipe,
  deleteFamilyRecipe,
};
