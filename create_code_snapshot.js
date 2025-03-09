// ⚠️ Use at your own risk. Do not include sensitive data from your codebase.
// ⚠️ Validate your output file has no sensitive data. This does not do so automatically.
// This is for experimental usage and learning only. No warranty.

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the output file path for the code snapshot
const outputFilePath = process.argv[2] || process.env.OUTPUT_PATH || path.join(__dirname, 'code_snapshot.txt');

// Directories and files to exclude from the snapshot
const excludeDirs = ['node_modules', '.git', '.next', '.cursor'];
const excludeFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.test'];

// File extensions to include in the snapshot
const includeExtensions = ['.tsx', '.ts', '.js', '.css', '.json'];

// Store .gitignore patterns
let gitignorePatterns = [];

// Function to log messages
function logMessage(message) {
  console.log(`[LOG] ${message}`);
}

// Function to write file content to the output file
function writeToFile(filePath, data) {
  try {
    fs.appendFileSync(outputFilePath, `\n--- ${filePath} ---\n`);
    fs.appendFileSync(outputFilePath, data);
    logMessage(`Successfully wrote ${filePath}`);
  } catch (error) {
    logMessage(`Error writing ${filePath}: ${error.message}`);
  }
}

// Function to read and apply .gitignore patterns (basic version)
function addGitignoreExclusions() {
  try {
    const gitignorePath = path.join(__dirname, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      gitignorePatterns = gitignoreContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      logMessage('Added .gitignore exclusions');
    } else {
      logMessage('No .gitignore file found');
    }
  } catch (error) {
    logMessage(`Error reading .gitignore: ${error.message}`);
  }
}

// Function to check if a path matches a simple pattern
function matchesPattern(pathStr, pattern) {
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(pathStr);
  }
  return pathStr === pattern || pathStr.startsWith(pattern + '/');
}

// Function to check if a file or directory should be excluded
function isExcluded(relativePath) {
  // Check hardcoded exclusions
  if (
    excludeDirs.some(dir => relativePath.startsWith(dir)) ||
    excludeFiles.some(file => relativePath.endsWith(file))
  ) {
    return true;
  }
  // Check .gitignore patterns
  return gitignorePatterns.some(pattern => matchesPattern(relativePath, pattern));
}

// Function to check if a file should be included based on its extension
function isIncluded(filePath) {
  return includeExtensions.some(ext => filePath.endsWith(ext));
}

// Recursive function to read directories and process files
function readDirectory(directory) {
  try {
    logMessage(`Reading directory: ${directory}`);
    const files = fs.readdirSync(directory, { withFileTypes: true });
    files.forEach(dirent => {
      const fullPath = path.join(directory, dirent.name);
      const relativePath = path.relative(__dirname, fullPath);

      if (dirent.isDirectory()) {
        if (!isExcluded(relativePath)) {
          readDirectory(fullPath);
        } else {
          logMessage(`Skipping excluded directory: ${relativePath}`);
        }
      } else if (dirent.isFile()) {
        if (!isExcluded(relativePath) && isIncluded(relativePath)) {
          try {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            writeToFile(relativePath, fileContent);
          } catch (error) {
            logMessage(`Error reading ${relativePath}: ${error.message}`);
          }
        } else {
          logMessage(`Skipping file: ${relativePath} (excluded or not included)`);
        }
      }
    });
  } catch (error) {
    logMessage(`Error accessing directory ${directory}: ${error.message}`);
  }
}

// Clear the output file before starting
if (fs.existsSync(outputFilePath)) {
  fs.unlinkSync(outputFilePath);
  logMessage(`Cleared previous snapshot at ${outputFilePath}`);
}

// Add .gitignore exclusions before starting the directory read
addGitignoreExclusions();

// Start reading from the root directory
readDirectory(__dirname);

console.log('Code snapshot created at', outputFilePath);