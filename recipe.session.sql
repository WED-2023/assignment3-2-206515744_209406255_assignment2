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

CREATE TABLE myrecipes (
  recipe_id INT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255),
  image TEXT,
  time INT,
  popularity INT,
  vegan BOOLEAN,
  glutenFree BOOLEAN,
  number_of_portions INT,
  summary TEXT,
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
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);
CREATE TABLE FavoriteRecipes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);
CREATE TABLE lastviewed(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  added_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);
CREATE TABLE recipe_ingredients (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  ingredient_number INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount INT,
  unit VARCHAR(50) NOT NULL,
  description TEXT,
  PRIMARY KEY (user_id, recipe_id, ingredient_number),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);
CREATE TABLE recipe_instructions (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  instruction_number INT NOT NULL,
  instruction TEXT NOT NULL,
  PRIMARY KEY (user_id, recipe_id, instruction_number),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
 
);
create table recipe_equipments (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  equipment_number INT NOT NULL,
  equipment VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, recipe_id, equipment_number),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);
