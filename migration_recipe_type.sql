-- Migration script to update existing tables with recipe_type enum
-- Run this AFTER backing up your database

USE grandma_recipes_db;

-- Add recipe_type column to recipeingredients table
ALTER TABLE recipeingredients
ADD COLUMN recipe_type ENUM('user', 'family') NOT NULL DEFAULT 'user';

-- Update primary key to include recipe_type
ALTER TABLE recipeingredients DROP PRIMARY KEY;

ALTER TABLE recipeingredients
ADD PRIMARY KEY (
    user_id,
    recipe_id,
    ingredient_number,
    recipe_type
);

-- Remove foreign key constraint to myrecipes (since family recipes won't be in myrecipes)
ALTER TABLE recipeingredients
DROP FOREIGN KEY recipeingredients_ibfk_2;

-- Add recipe_type column to recipeinstructions table
ALTER TABLE recipeinstructions
ADD COLUMN recipe_type ENUM('user', 'family') NOT NULL DEFAULT 'user';

-- Update primary key to include recipe_type
ALTER TABLE recipeinstructions DROP PRIMARY KEY;

ALTER TABLE recipeinstructions
ADD PRIMARY KEY (
    user_id,
    recipe_id,
    instruction_number,
    recipe_type
);

-- Remove foreign key constraint to myrecipes
ALTER TABLE recipeinstructions
DROP FOREIGN KEY recipeinstructions_ibfk_2;

-- Add recipe_type column to recipeequipments table
ALTER TABLE recipeequipments
ADD COLUMN recipe_type ENUM('user', 'family') NOT NULL DEFAULT 'user';

-- Update primary key to include recipe_type
ALTER TABLE recipeequipments DROP PRIMARY KEY;

ALTER TABLE recipeequipments
ADD PRIMARY KEY (
    user_id,
    recipe_id,
    equipment_number,
    recipe_type
);

-- Remove foreign key constraint to myrecipes
ALTER TABLE recipeequipments
DROP FOREIGN KEY recipeequipments_ibfk_2;

-- Verify the changes
SHOW CREATE TABLE recipeingredients;

SHOW CREATE TABLE recipeinstructions;

SHOW CREATE TABLE recipeequipments;