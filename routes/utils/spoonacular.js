const axios = require("axios");
module.exports = axios.create({
  baseURL: "https://api.spoonacular.com/recipes",
  params: {
    apiKey: process.env.spoonacular_apiKey,
    includeNutrition: false,
  },
  timeout: 5000,
});