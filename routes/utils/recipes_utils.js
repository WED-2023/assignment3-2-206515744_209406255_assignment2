const spoonacular = require("./spoonacular");
const user_utils = require("./user_utils");
const LRU = require("lru-cache");

// simple LRU cache: up to 500 entries, 1h TTL
const recipeCache = new LRU({ max: 500, maxAge: 1000 * 60 * 60 });

/**
 * Fetch recipe info, using cache if available
 */
async function getRecipeInformationCached(recipe_id) {
  if (recipeCache.has(recipe_id)) {
    return recipeCache.get(recipe_id);
  }
  const data = await getRecipeInformation(recipe_id);
  recipeCache.set(recipe_id, data);
  return data;
}

/**
 * Bulk fetch via Spoonacular
 */
async function getRecipesInformationBulk(ids = []) {
  if (!ids.length) return [];
  const { data } = await spoonacular.get(`${api_domain}/informationBulk`, {
    params: {
      ids: ids.join(","),
      includeNutrition: false,
      apiKey: process.env.spoonacular_apiKey,
    },
  });
  // cache each result
  data.forEach((r) => recipeCache.set(r.id, r));
  return data;
}

/**
 * Override to use bulk when possible
 */
async function getRecipesDetails(recipesIdList = []) {
  // use bulk if list > 1
  const infos =
    recipesIdList.length > 1
      ? await getRecipesInformationBulk(recipesIdList)
      : [await getRecipeInformationCached(recipesIdList[0])];
  return infos.map((data) => {
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
  });
}

async function getRecipeInformation(recipe_id) {
  const response = await spoonacular.get(
    `${api_domain}/${recipe_id}/information`,
    {
      params: {
        includeNutrition: false,
        apiKey: process.env.spoonacular_apiKey,
      },
    }
  );
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
  const res = await spoonacular.get(`${api_domain}/random`, {
    params: { number, apiKey: process.env.spoonacular_apiKey },
  });
  return res.data.recipes.map((r) => ({
    id: r.id,
    title: r.title,
    readyInMinutes: r.readyInMinutes,
    image: r.image,
    spoonacularScore: r.spoonacularScore,
    vegan: r.vegan,
    vegetarian: r.vegetarian,
    glutenFree: r.glutenFree,
  }));
}

async function getSearchRecipeDetails(params = {}, numberOfResults = 5) {
  console.log("params", params);
  const { data } = await spoonacular.get(`${api_domain}/complexSearch`, {
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
      spoonacularScore,
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
      spoonacularScore,
      vegan,
      vegetarian,
      glutenFree,
      instructions: steps,
    });
    console.log("recipes", recipes);
  }
  return recipes;
}

async function enrichRecipesWithUserInfo(user_id, recipes = []) {
  if (!user_id || recipes.length === 0) return recipes;
  // collect all ids and fetch flags in one query
  const ids = recipes.map((r) => r.id);
  const { viewedSet, favoriteSet } = await user_utils.getRecipesStatus(
    user_id,
    ids
  );
  // annotate each recipe from the two Sets
  return recipes.map((r) => ({
    ...r,
    viewed: viewedSet.has(r.id),
    favorite: favoriteSet.has(r.id),
  }));
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
  getRecipeInformation: getRecipeInformationCached, // swap in cached version
  getRecipeDetails,
  getFullRecipeDetails,
  getRandomRecipeDetails,
  getSearchRecipeDetails,
  getRecipesDetails,
  enrichRecipesWithUserInfo,
};
