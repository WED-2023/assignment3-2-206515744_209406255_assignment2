const DButils = require("./DButils");

async function getUserIDFromUsername(username) {
  const user_id = await DButils.execQuery(
    `select user_id from users where username='${username}'`
  );
  return user_id;
}

async function markAsFavorite(user_id, recipe_id) {
  console.log("WAS HERE");
  await DButils.execQuery(
    `insert into FavoriteRecipes (user_id, recipe_id) values ('${user_id}',${recipe_id})`
  );
}

async function deleteUserFavorite(user_id, recipe_id) {
  await DButils.execQuery(
    `delete from favoriterecipes where user_id = '${user_id}' AND recipe_id = ${recipe_id}`
  );
}

async function getFavoriteRecipes(user_id) {
  const recipes_id = await DButils.execQuery(
    `select recipe_id from FavoriteRecipes where user_id='${user_id}'`
  );
  return recipes_id;
}

async function checkIfFavorite(userId, recipeId) {
  const result = await DButils.execQuery(
    `SELECT * 
    FROM favoriterecipes
    WHERE user_id='${userId}' AND recipe_id='${recipeId}'`
  );
  return result.length > 0;
}

async function getLastViewed(user_id, number = 3) {
  const recipes_id = await DButils.execQuery(
    `SELECT *
    FROM lastviewed
    WHERE user_id='${user_id}'
    ORDER BY added_timestamp DESC limit ${number}`
  );
  return recipes_id;
}

async function checkIfViewed(userId, recipeId) {
  const result = await DButils.execQuery(
    `SELECT *
    FROM lastviewed
    WHERE user_id='${userId}' AND recipe_id='${recipeId}'`
  );
  return result.length > 0;
}

async function addLastViewed(user_id, recipe_id) {
  await DButils.execQuery(
    `insert into lastviewed (user_id, recipe_id) values ('${user_id}','${recipe_id}')`
  );
}

async function deleteLastViewed(user_id, recipe_id) {
  await DButils.execQuery(
    `delete from lastviewedwhere user_id = '${user_id}' AND recipe_id = ${recipe_id}`
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
  await DButils.execQuery(`insert into myrecipes (user_id, recipe_id, title, image, time, popularity, vegan, glutenFree, number_of_portions, summary)
    values ('${user_id}','${recipe_id}','${title}','${image}','${time}','${popularity}','${vegan}','${glutenFree}','${numberOfPortions}','${summary}')`);
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
  await DButils.execQuery(`insert into recipe_ingredients (user_id, recipe_id, ingredient_number, name, amount, unit, description) 
    values ('${user_id}','${recipe_id}','${ingredient_number}','${name}','${amount}','${unit}','${description}')`);
}

async function addInstrucitons(
  user_id,
  recipe_id,
  instruction_number,
  instruction
) {
  await DButils.execQuery(`insert into recipe_instructions (user_id, recipe_id, instruction_number, instruction) 
    values ('${user_id}','${recipe_id}','${instruction_number}','${instruction}')`);
}

async function addEquipments(user_id, recipe_id, equipment_number, equipment) {
  await DButils.execQuery(`insert into recipe_equipments (user_id, recipe_id, equipment_number, equipment) 
    values ('${user_id}','${recipe_id}','${equipment_number}','${equipment}')`);
}

async function getUserRecipes(user_id) {
  const user_recipes = await DButils.execQuery(
    `SELECT * FROM myrecipes WHERE user_id='${user_id}'`
  );
  const recipes = [];

  for (let i = 0; i < user_recipes.length; i++) {
    const user_recipe = user_recipes[i];
    const user_recipe_id = user_recipe.recipe_id;

    const recipe = await getMyRecipeDetails(
      user_id,
      user_recipe_id,
      user_recipe
    );

    recipes.push(recipe);
  }

  return recipes;
}

async function getUserSpecificRecipe(user_id, recipe_id) {
  const user_recipe = await DButils.execQuery(
    `SELECT * FROM myrecipes WHERE user_id='${user_id}' AND recipe_id='${recipe_id}'`
  );

  const recipe = await getMyRecipeDetails(user_id, recipe_id, user_recipe[0]);

  return recipe;
}

async function getMyRecipeDetails(user_id, user_recipe_id, user_recipe) {
  const equipments = await DButils.execQuery(
    `SELECT * FROM recipe_equipments WHERE user_id='${user_id}' AND recipe_id='${user_recipe_id}' ORDER BY equipment_number`
  );
  const ingredients = await DButils.execQuery(
    `SELECT * FROM recipe_ingredients WHERE user_id='${user_id}' AND recipe_id='${user_recipe_id}' ORDER BY ingredient_number`
  );
  const instructions = await DButils.execQuery(
    `SELECT * FROM recipe_instructions WHERE user_id='${user_id}' AND recipe_id='${user_recipe_id}' ORDER BY instruction_number`
  );

  console.log("This is inside the function RECIPE:  ", user_recipe);

  let usersrecipe = {
    id: user_recipe_id,
    title: user_recipe.title,
    image: user_recipe.image,
    readyInMinutes: user_recipe.time,
    aggregateLikes: user_recipe.popularity,
    vegan: user_recipe.vegan,
    glutenFree: user_recipe.glutenFree,
    ingredients: ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      description: ingredient.description,
    })),
    instructions: instructions.map((instruct) => instruct.instruction),
    numberOfPortions: user_recipe.number_of_portions, // Adjust the property name here
    equipment: equipments.map((equipmentItem) => equipmentItem.equipment),
  };

  return usersrecipe;
}

async function deleteUserRecipe(user_id, recipe_id) {
  await DButils.execQuery(
    `delete from myrecipes where user_id = '${user_id}' AND recipe_id = ${recipe_id}`
  );
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.deleteUserFavorite = deleteUserFavorite;
exports.getLastViewed = getLastViewed;
exports.addLastViewed = addLastViewed;
exports.deleteLastViewed = deleteLastViewed;
exports.addUserRecipe = addUserRecipe;
exports.addIngredients = addIngredients;
exports.getUserRecipes = getUserRecipes;
exports.addInstrucitons = addInstrucitons;
exports.addEquipments = addEquipments;
exports.getUserIDFromUsername = getUserIDFromUsername;
exports.deleteUserRecipe = deleteUserRecipe;
exports.checkIfViewed = checkIfViewed;
exports.checkIfFavorite = checkIfFavorite;
exports.getUserSpecificRecipe = getUserSpecificRecipe;