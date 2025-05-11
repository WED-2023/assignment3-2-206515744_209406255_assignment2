USE grandma_recipes_db;

CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  firstname VARCHAR(50) NOT NULL,
  lastname VARCHAR(50) NOT NULL,
  country VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profilePic TEXT
);

CREATE TABLE Recipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  image_url TEXT,
  prep_time_minutes INT,
  servings INT,
  likes INT,
  ingredients TEXT,        -- JSON string
  instructions TEXT,       -- JSON string
  is_vegan BOOLEAN,
  is_gluten_free BOOLEAN,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE FamilyRecipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  image_url TEXT,
  prep_time_minutes INT,
  servings INT,
  ingredients TEXT,
  instructions TEXT,
  is_vegan BOOLEAN,
  is_gluten_free BOOLEAN,
  family_member VARCHAR(100),
  occasion VARCHAR(100),
  step_images TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE MealPlan (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  position INT,
  progress FLOAT CHECK (progress >= 0 AND progress <= 1),
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);
CREATE TABLE FavoriteRecipes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);
CREATE TABLE WatchedRecipes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  watchedon TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);
CREATE TABLE Ingredients (
  ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);
Create TABLE RecipeIngredients (
  recipe_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  amount VARCHAR(50),
  unit VARCHAR(50),
  PRIMARY KEY (recipe_id, ingredient_id),
  FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id),
  FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
);