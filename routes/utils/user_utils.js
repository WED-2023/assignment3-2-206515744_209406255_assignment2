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
async function getLikedRecipes(userId, recipeId) {
  const rows = await DButils.execQuery(
    `SELECT recipe_id FROM likedrecipes WHERE user_id = ?`,
    [userId]
  );
  return rows.map((r) => r.recipe_id);
}
async function markAsLiked(userId, recipeId) {
  await DButils.execQuery(
    `INSERT INTO likedrecipes (user_id, recipe_id) VALUES (?, ?)`,
    [userId, recipeId]
  );
}
async function isRecipeLiked(userId, recipeId) {
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

async function addIngredients(
  userId,
  recipeId,
  ingredients,
  recipeType = "user"
) {
  for (const [
    idx,
    { name, amount, unit, description },
  ] of ingredients.entries()) {
    await DButils.execQuery(
      `INSERT INTO recipeingredients 
         (user_id, recipe_id, ingredient_number, name, amount, unit, description, recipe_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, recipeId, idx + 1, name, amount, unit, description, recipeType]
    );
  }
}

async function addInstructions(
  userId,
  recipeId,
  instructions,
  recipeType = "user"
) {
  for (const [idx, instruction] of instructions.entries()) {
    await DButils.execQuery(
      `INSERT INTO recipeinstructions 
         (user_id, recipe_id, instruction_number, instruction, recipe_type)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, recipeId, idx + 1, instruction, recipeType]
    );
  }
}

async function addEquipments(
  userId,
  recipeId,
  equipments,
  recipeType = "user"
) {
  for (const [idx, equipment] of equipments.entries()) {
    await DButils.execQuery(
      `INSERT INTO recipeequipments 
         (user_id, recipe_id, equipment_number, equipment, recipe_type)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, recipeId, idx + 1, equipment, recipeType]
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
        WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user'
     ORDER BY equipment_number`,
      [userId, recipeId]
    ),
    DButils.execQuery(
      `SELECT name, amount, unit, description 
         FROM recipeingredients 
        WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user'
     ORDER BY ingredient_number`,
      [userId, recipeId]
    ),
    DButils.execQuery(
      `SELECT instruction 
         FROM recipeinstructions 
        WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user'
     ORDER BY instruction_number`,
      [userId, recipeId]
    ),
  ]);

  return {
    id: recipeId,
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
    `DELETE FROM recipeingredients WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user'`,
    [userId, recipeId]
  );
  await DButils.execQuery(
    `DELETE FROM recipeinstructions WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user'`,
    [userId, recipeId]
  );
  await DButils.execQuery(
    `DELETE FROM recipeequipments WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user'`,
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
  equipment,
  image
) {
  const result = await DButils.execQuery(
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

  const familyRecipeId = result.insertId;

  // Add ingredients, instructions, and equipment to the shared tables
  await addIngredients(userId, familyRecipeId, ingredients, "family");
  await addInstructions(userId, familyRecipeId, instructions, "family");
  await addEquipments(userId, familyRecipeId, equipment, "family");

  return familyRecipeId;
}

async function deleteFamilyRecipe(userId, familyRecipeId) {
  // Delete related ingredients, instructions, and equipment
  await DButils.execQuery(
    `DELETE FROM recipeingredients WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'family'`,
    [userId, familyRecipeId]
  );
  await DButils.execQuery(
    `DELETE FROM recipeinstructions WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'family'`,
    [userId, familyRecipeId]
  );
  await DButils.execQuery(
    `DELETE FROM recipeequipments WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'family'`,
    [userId, familyRecipeId]
  );

  // Delete the family recipe itself
  await DButils.execQuery(
    `DELETE FROM familyrecipes WHERE user_id = ? AND familyrecipe_id = ?`,
    [userId, familyRecipeId]
  );
}

async function getUserRecipePreparationDetails(user_id, recipe_id) {
  // Get basic recipe info
  const myRecipes = await DButils.execQuery(
    "SELECT title, image, numberOfPortions FROM myrecipes WHERE recipe_id = ? AND user_id = ?",
    [recipe_id, user_id]
  );

  if (myRecipes.length === 0) {
    throw {
      status: 404,
      message: "Recipe not found or doesn't belong to user",
    };
  }

  const { title, image, numberOfPortions } = myRecipes[0];

  // Get instructions
  const instructions = await DButils.execQuery(
    "SELECT instruction_number, instruction FROM recipeinstructions WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user' ORDER BY instruction_number",
    [user_id, recipe_id]
  );

  // Get equipment
  const equipmentRows = await DButils.execQuery(
    "SELECT equipment_number, equipment FROM recipeequipments WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user' ORDER BY equipment_number",
    [user_id, recipe_id]
  );

  // Get ingredients
  const ingredientRows = await DButils.execQuery(
    "SELECT ingredient_number, name, amount, unit, description FROM recipeingredients WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'user' ORDER BY ingredient_number",
    [user_id, recipe_id]
  );

  // Combine into preparation steps
  const preparationSteps = instructions.map((ins) => ({
    stepNumber: ins.instruction_number,
    instruction: ins.instruction,
    equipment: equipmentRows
      .filter((e) => e.equipment_number === ins.instruction_number)
      .map((e) => e.equipment),
    ingredients: ingredientRows
      .filter((i) => i.ingredient_number === ins.instruction_number)
      .map((i) => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        description: i.description,
      })),
  }));

  return {
    id: recipe_id,
    title,
    image,
    numberOfPortions: Number(numberOfPortions) || 1,
    preparationSteps,
  };
}

async function getFamilyRecipePreparationDetails(user_id, familyRecipe_id) {
  // Get basic family recipe info
  const familyRecipes = await DButils.execQuery(
    "SELECT family_member, occasion, image FROM familyrecipes WHERE familyrecipe_id = ? AND user_id = ?",
    [familyRecipe_id, user_id]
  );

  if (familyRecipes.length === 0) {
    throw {
      status: 404,
      message: "Family recipe not found or doesn't belong to user",
    };
  }

  const { family_member, occasion, image } = familyRecipes[0];

  // Get instructions
  const instructions = await DButils.execQuery(
    "SELECT instruction_number, instruction FROM recipeinstructions WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'family' ORDER BY instruction_number",
    [user_id, familyRecipe_id]
  );

  // Get equipment
  const equipmentRows = await DButils.execQuery(
    "SELECT equipment_number, equipment FROM recipeequipments WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'family' ORDER BY equipment_number",
    [user_id, familyRecipe_id]
  );

  // Get ingredients
  const ingredientRows = await DButils.execQuery(
    "SELECT ingredient_number, name, amount, unit, description FROM recipeingredients WHERE user_id = ? AND recipe_id = ? AND recipe_type = 'family' ORDER BY ingredient_number",
    [user_id, familyRecipe_id]
  );

  // Combine into preparation steps
  const preparationSteps = instructions.map((ins) => ({
    stepNumber: ins.instruction_number,
    instruction: ins.instruction,
    equipment: equipmentRows
      .filter((e) => e.equipment_number === ins.instruction_number)
      .map((e) => e.equipment),
    ingredients: ingredientRows
      .filter((i) => i.ingredient_number === ins.instruction_number)
      .map((i) => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        description: i.description,
      })),
  }));

  return {
    id: familyRecipe_id,
    title: `${family_member}'s ${occasion} Recipe`,
    image,
    numberOfPortions: 1, // Default for family recipes
    preparationSteps,
  };
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
  getUserRecipePreparationDetails,
  getFamilyRecipePreparationDetails,
};
