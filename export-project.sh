#!/bin/bash

# Export script for TaskSmart project
# This script prepares the project for local development by:
# 1. Creating a clean directory structure
# 2. Copying source files
# 3. Applying the cleaned configuration files
# 4. Creating the proper folder structure

# Make the script exit on any error
set -e

# Create the export directory
EXPORT_DIR="tasksmart-export"
mkdir -p $EXPORT_DIR

# Copy project files and structure
echo "Copying project files..."
cp -r client $EXPORT_DIR/
cp -r server $EXPORT_DIR/
cp -r shared $EXPORT_DIR/
cp -r attached_assets $EXPORT_DIR/

# Copy cleaned configuration files
echo "Setting up configuration files..."
cp package.json.cleaned $EXPORT_DIR/package.json
cp vite.config.ts.cleaned $EXPORT_DIR/vite.config.ts
cp .env.example $EXPORT_DIR/
cp README.md $EXPORT_DIR/
cp drizzle.config.ts $EXPORT_DIR/
cp tsconfig.json $EXPORT_DIR/
cp postcss.config.js $EXPORT_DIR/
cp tailwind.config.ts $EXPORT_DIR/
cp components.json $EXPORT_DIR/

# Create migrations directory
mkdir -p $EXPORT_DIR/migrations

# Create a gitignore file
cat > $EXPORT_DIR/.gitignore << EOL
# Node.js
node_modules/
dist/
.env
npm-debug.log
.DS_Store

# Build outputs
.cache/
coverage/

# IDEs and editors
.vscode/
.idea/
*.swp
*.swo
EOL

echo "Project exported successfully to $EXPORT_DIR/"
echo "To use the project locally:"
echo "1. cd $EXPORT_DIR"
echo "2. cp .env.example .env (and then edit with your credentials)"
echo "3. npm install"
echo "4. npm run dev"