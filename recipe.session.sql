CREATE DATABASE IF NOT EXISTS grandma_recipes_db;

USE grandma_recipes_db;

CREATE TABLE users (
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
  recipe_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255),
  image TEXT,
  readyInMinutes INT,
  vegan BOOLEAN,
  vegetarian BOOLEAN,
  glutenFree BOOLEAN,
  numberOfPortions INT,
  summary TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE familyrecipes (
  familyrecipe_id INT AUTO_INCREMENT,
  user_id INT NOT NULL,
  family_member VARCHAR(100),
  occasion VARCHAR(100),
  ingredients TEXT,
  instructions TEXT,
  image TEXT,
  PRIMARY KEY (familyrecipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE mealplan (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  position INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);
CREATE TABLE favoriterecipes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE likedrecipes (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE lastviewed(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  added_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE TABLE recipeingredients (
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
CREATE TABLE recipeinstructions (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  instruction_number INT NOT NULL,
  instruction TEXT NOT NULL,
  PRIMARY KEY (user_id, recipe_id, instruction_number),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
 
);
create table recipeequipments (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  equipment_number INT NOT NULL,
  equipment VARCHAR(255) NOT NULL,
  PRIMARY KEY (user_id, recipe_id, equipment_number),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES myrecipes(recipe_id)
);

