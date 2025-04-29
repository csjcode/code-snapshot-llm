import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Construct a date string (YYYYMMDD)
const dateString = new Date().toISOString().split('T')[0].replace(/-/g, '');
const defaultAllFilesOutputFileName = `${dateString}-allfiles-code_snapshot.txt`;
const defaultTopLevelOutputFileName = `${dateString}-code_snapshot.txt`;

// Determine output directory
const docsDir = path.join(__dirname, 'docs');
const outputDir = fs.existsSync(docsDir) ? docsDir : __dirname;

// Define the output file paths
const mainOutputFilePath = path.join(outputDir, defaultAllFilesOutputFileName);
const topLevelOutputFilePath = path.join(outputDir, defaultTopLevelOutputFileName);

// Directories and files to exclude from the snapshot
const excludeDirs = ['node_modules', '.git', '.next', '.cursor'];
const excludeFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.test', 'package-lock.json'];

// Directories to exclude from the tree command
const excludeDirsTree = ['node_modules', '.next', '.vercel', 'supabase'];

// File extensions to include in the snapshot
const includeExtensions = ['.tsx', '.ts', '.js', '.css', '.json', '.prisma', '.md'];

// Store .gitignore patterns
let gitignorePatterns = [];

// Function to log messages
function logMessage(message) {
  console.log(`[LOG] ${message}`);
}

// Function to generate and prepend tree output for a specific directory
function prependTreeOutput(outputPath, directory = __dirname) {
  try {
    const treeCommand = `tree -I '${excludeDirsTree.join('|')}'`;
    const treeOutput = execSync(treeCommand, { cwd: directory, encoding: 'utf-8' });
    const dirName = path.relative(__dirname, directory) || '.';
    fs.writeFileSync(outputPath, `--- Project Directory Structure ---\nCurrent directory: ${dirName}/\n${treeOutput}\n`);
    logMessage(`Prepended tree output to ${outputPath}`);
  } catch (error) {
    logMessage(`Error generating tree output for ${outputPath}: ${error.message}`);
    fs.writeFileSync(outputPath, `--- Project Directory Structure ---\nError generating tree output\n\n`);
  }
}

// Function to write file content to the output file
function writeToFile(outputPath, filePath, data) {
  try {
    fs.appendFileSync(outputPath, `\n--- ${filePath} ---\n`);
    fs.appendFileSync(outputPath, data);
    logMessage(`Successfully wrote ${filePath} to ${outputPath}`);
  } catch (error) {
    logMessage(`Error writing ${filePath} to ${outputPath}: ${error.message}`);
  }
}

// Function to read and apply .gitignore patterns
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
  if (
    excludeDirs.some(dir => relativePath.startsWith(dir)) ||
    excludeFiles.some(file => relativePath.endsWith(file))
  ) {
    return true;
  }
  return gitignorePatterns.some(pattern => matchesPattern(relativePath, pattern));
}

// Function to check if a file should be included based on its extension
function isIncluded(filePath) {
  return includeExtensions.some(ext => filePath.endsWith(ext));
}

// Recursive function to read directories and process files
function readDirectory(directory, outputPath, baseDir = __dirname) {
  try {
    logMessage(`Reading directory: ${directory}`);
    const files = fs.readdirSync(directory, { withFileTypes: true });
    files.forEach(dirent => {
      const fullPath = path.join(directory, dirent.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (dirent.isDirectory()) {
        if (!isExcluded(relativePath)) {
          readDirectory(fullPath, outputPath, baseDir);
        } else {
          logMessage(`Skipping excluded directory: ${relativePath}`);
        }
      } else if (dirent.isFile()) {
        if (!isExcluded(relativePath) && isIncluded(relativePath)) {
          try {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            writeToFile(outputPath, relativePath, fileContent);
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

// Function to create snapshot for a single directory
function createDirectorySnapshot(topLevelDir) {
  const dirName = path.basename(topLevelDir);
  const outputFileName = `20250429-${dirName}-code_snapshot.txt`;
  const outputPath = path.join(outputDir, outputFileName);

  // Clear or create output file
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // Prepend tree output for this directory
  prependTreeOutput(outputPath, topLevelDir);

  // Process files in this directory
  readDirectory(topLevelDir, outputPath, topLevelDir);

  console.log(`Directory snapshot created at ${outputPath}`);
}

// Function to create snapshot for top-level directory files
function createTopLevelSnapshot() {
  // Clear or create output file
  if (fs.existsSync(topLevelOutputFilePath)) {
    fs.unlinkSync(topLevelOutputFilePath);
  }

  // Prepend tree output for current directory
  prependTreeOutput(topLevelOutputFilePath);

  // Process only files in the current directory (not recursive)
  try {
    const files = fs.readdirSync(__dirname, { withFileTypes: true });
    files.forEach(dirent => {
      if (dirent.isFile()) {
        const fullPath = path.join(__dirname, dirent.name);
        const relativePath = dirent.name;
        if (!isExcluded(relativePath) && isIncluded(relativePath)) {
          try {
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            writeToFile(topLevelOutputFilePath, relativePath, fileContent);
          } catch (error) {
            logMessage(`Error reading ${relativePath}: ${error.message}`);
          }
        } else {
          logMessage(`Skipping file: ${relativePath} (excluded or not included)`);
        }
      }
    });
  } catch (error) {
    logMessage(`Error accessing top-level directory: ${error.message}`);
  }

  console.log(`Top-level snapshot created at ${topLevelOutputFilePath}`);
}

// Function to create main snapshot
function createMainSnapshot() {
  // Clear or create main output file
  if (fs.existsSync(mainOutputFilePath)) {
    fs.unlinkSync(mainOutputFilePath);
  }

  // Prepend tree output for entire project
  prependTreeOutput(mainOutputFilePath);

  // Add .gitignore exclusions
  addGitignoreExclusions();

  // Process all files
  readDirectory(__dirname, mainOutputFilePath);

  console.log('Main code snapshot created at', mainOutputFilePath);
}

// Function to get top-level directories
function getTopLevelDirectories() {
  return fs.readdirSync(__dirname, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !isExcluded(dirent.name))
    .map(dirent => path.join(__dirname, dirent.name));
}

// Prompt user for snapshot type
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Select snapshot type:\n1. All files by directory + full snapshot + top-level snapshot\n2. Only full snapshot + top-level snapshot\nEnter 1, 2, or press Enter for 1: ', (answer) => {
  if (answer === '' || answer === '1') {
    // Create snapshots for each top-level directory
    const topLevelDirs = getTopLevelDirectories();
    topLevelDirs.forEach(dir => createDirectorySnapshot(dir));
    // Create main snapshot
    createMainSnapshot();
    // Create top-level snapshot
    createTopLevelSnapshot();
  } else if (answer === '2') {
    // Create only main snapshot and top-level snapshot
    createMainSnapshot();
    createTopLevelSnapshot();
  } else {
    console.log('Invalid input. Creating all snapshots.');
    const topLevelDirs = getTopLevelDirectories();
    topLevelDirs.forEach(dir => createDirectorySnapshot(dir));
    createMainSnapshot();
    createTopLevelSnapshot();
  }
  rl.close();
});
