const axios = require("axios");
const user_utils = require("./user_utils");
const api_domain = "https://api.spoonacular.com/recipes";

const recipeCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let randomRecipeCache = null;
let randomCacheTimestamp = 0;
const RANDOM_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getRecipeInformation(recipe_id) {
  const cacheKey = `recipe_${recipe_id}`;
  const cached = recipeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await axios.get(`${api_domain}/${recipe_id}/information`, {
    params: { includeNutrition: false, apiKey: process.env.spoonacular_apiKey },
  });

  // Cache the result
  recipeCache.set(cacheKey, {
    data: response.data,
    timestamp: Date.now(),
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
    spoonacularScore,
    vegan,
    vegetarian,
    glutenFree,
  } = data;
  return {
    id,
    title,
    readyInMinutes,
    image,
    spoonacularScore,
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
    spoonacularScore,
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
    spoonacularScore,
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
  // Use cached random recipes if available and fresh
  if (
    randomRecipeCache &&
    Date.now() - randomCacheTimestamp < RANDOM_CACHE_DURATION
  ) {
    return randomRecipeCache.slice(0, number);
  }

  const res = await axios.get(`${api_domain}/random`, {
    params: { number: 10, apiKey: process.env.spoonacular_apiKey }, // Get more to cache
  });

  randomRecipeCache = res.data.recipes.map((r) => ({
    id: r.id,
    title: r.title,
    readyInMinutes: r.readyInMinutes,
    image: r.image,
    spoonacularScore: r.spoonacularScore,
    vegan: r.vegan,
    vegetarian: r.vegetarian,
    glutenFree: r.glutenFree,
  }));

  randomCacheTimestamp = Date.now();
  return randomRecipeCache.slice(0, number);
}

async function getSearchRecipeDetails(params = {}, numberOfResults = 5) {
  const { data } = await axios.get(`${api_domain}/complexSearch`, {
    params: {
      ...params,
      apiKey: process.env.spoonacular_apiKey,
      addRecipeInformation: true, // This adds basic recipe info to avoid extra calls
      fillIngredients: true, // This adds ingredient info if needed
    },
  });
  const results = data.results || [];
  const limit = Math.min(results.length, numberOfResults);

  // No need for the loop with individual API calls anymore
  return results.slice(0, limit).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    readyInMinutes: recipe.readyInMinutes,
    image: recipe.image,
    spoonacularScore: recipe.spoonacularScore,
    vegan: recipe.vegan,
    vegetarian: recipe.vegetarian,
    glutenFree: recipe.glutenFree,
  }));
}

async function getRecipesDetails(recipesIdList = []) {
  if (recipesIdList.length === 0) return [];

  // Use bulk endpoint for multiple recipes
  if (recipesIdList.length > 1) {
    const response = await axios.get(`${api_domain}/informationBulk`, {
      params: {
        ids: recipesIdList.join(","),
        includeNutrition: false,
        apiKey: process.env.spoonacular_apiKey,
      },
    });

    return response.data.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      readyInMinutes: recipe.readyInMinutes,
      image: recipe.image,
      spoonacularScore: recipe.spoonacularScore,
      vegan: recipe.vegan,
      vegetarian: recipe.vegetarian,
      glutenFree: recipe.glutenFree,
    }));
  }

  // Single recipe - use existing method
  return [await getRecipeDetails(recipesIdList[0])];
}

async function enrichRecipesWithUserInfo(user_id, recipes = []) {
  if (!user_id) return recipes;
  for (const recipe of recipes) {
    recipe.viewed = await user_utils.isRecipeViewed(user_id, recipe.id);
    recipe.favorite = await user_utils.isRecipeFavorite(user_id, recipe.id);
  }
  return recipes;
}

function extractInstructionsAndEquipment(instructionsArr = []) {
  const steps = [];
  const equipSet = new Set();
  // Collect from all instruction groups
  for (const group of instructionsArr) {
    if (Array.isArray(group.steps)) {
      for (const step of group.steps) {
        if (step.step) steps.push(step.step);
        if (Array.isArray(step.equipment)) {
          step.equipment.forEach((item) => equipSet.add(item.name));
        }
      }
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
