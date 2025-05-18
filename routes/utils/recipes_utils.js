const axios = require("axios");
const user_utils = require("./user_utils");
const api_domain = "https://api.spoonacular.com/recipes";

async function getRecipeInformation(recipe_id) {
  const response = await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: { includeNutrition: false, apiKey: process.env.spoonacular_apiKey },
  });
  return response.data;
}

async function getRecipeDetails(recipe_id) {
  const data = await getRecipeInformation(recipe_id);
  const {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
  } = data;
  return {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
  };
}

async function getFullRecipeDetails(recipe_id) {
  const data = await getRecipeInformation(recipe_id);
  const {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
    servings,
    analyzedInstructions,
    extendedIngredients,
    summary,
  } = data;
  const { steps, equipment } =
    extractInstructionsAndEquipment(analyzedInstructions);
  const cleanSummary = replaceHref(summary);
  const ingredients = extractIngredients(extendedIngredients);
  return {
    id,
    title,
    readyInMinutes,
    image,
    aggregateLikes,
    vegan,
    vegetarian,
    glutenFree,
    numberOfPortions: servings,
    instructions: steps,
    equipment,
    ingredients,
    summary: cleanSummary,
  };
}

async function getRandomRecipeDetails(number = 3) {
  const res = await axios.get(`${api_domain}/random`, {
    params: { number, apiKey: process.env.spoonacular_apiKey },
  });
  return res.data.recipes.map((r) => ({
    id: r.id,
    title: r.title,
    readyInMinutes: r.readyInMinutes,
    image: r.image,
    aggregateLikes: r.aggregateLikes,
    vegan: r.vegan,
    vegetarian: r.vegetarian,
    glutenFree: r.glutenFree,
  }));
}

async function getSearchRecipeDetails(params = {}, numberOfResults = 5) {
  console.log("params", params);
  const { data } = await axios.get(`${api_domain}/complexSearch`, {
    params: { ...params, apiKey: process.env.spoonacular_apiKey },
  });
  console.log("data", data);
  const results = data.results || [];
  const limit = Math.min(results.length, numberOfResults);
  console.log("limit", limit);
  const recipes = [];
  for (let i = 0; i < limit; i++) {
    const {
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      analyzedInstructions,
    } = await getRecipeInformation(results[i].id);
    const { steps } = extractInstructionsAndEquipment(analyzedInstructions);
    recipes.push({
      id,
      title,
      readyInMinutes,
      image,
      aggregateLikes,
      vegan,
      vegetarian,
      glutenFree,
      instructions: steps,
    });
    console.log("recipes", recipes);
  }
  return recipes;
}

async function getRecipesDetails(recipesIdList = []) {
  return Promise.all(recipesIdList.map((id) => getRecipeDetails(id)));
}

async function enrichRecipesWithUserInfo(user_id, recipes = []) {
  if (!user_id) return recipes;
  for (const recipe of recipes) {
    recipe.viewed = await user_utils.checkIfViewed(user_id, recipe.id);
    recipe.favorite = await user_utils.checkIfFavorite(user_id, recipe.id);
  }
  return recipes;
}

function extractInstructionsAndEquipment(instructionsArr = []) {
  const steps = [];
  const equipSet = new Set();
  if (instructionsArr.length) {
    for (const step of instructionsArr[0].steps) {
      steps.push(step.step);
      step.equipment.forEach((item) => equipSet.add(item.name));
    }
  }
  return { steps, equipment: Array.from(equipSet) };
}

function extractIngredients(ingredientsArr = []) {
  return ingredientsArr.map((ing, idx) => ({
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    description: ing.original,
  }));
}

function replaceHref(text = "") {
  return (
    text
      // strip <a> tags
      .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
      // strip all other HTML tags
      .replace(/<[^>]+>/g, "")
      // decode basic HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // remove non-printable characters
      .replace(/[^ -~]/g, "")
      .trim()
  );
}

module.exports = {
  getRecipeInformation,
  getRecipeDetails,
  getFullRecipeDetails,
  getRandomRecipeDetails,
  getSearchRecipeDetails,
  getRecipesDetails,
  enrichRecipesWithUserInfo,
};
