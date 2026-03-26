#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const open = require('open');

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  let mockupsDir = '.';
  let outputDir = '.';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mockups-dir' && args[i + 1]) {
      mockupsDir = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[++i];
    }
  }

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Find all variant directories with metadata.json
    const variantDirs = glob.sync(path.join(mockupsDir, '*/metadata.json'));
    
    if (variantDirs.length === 0) {
      console.error(`No variants found in ${mockupsDir}`);
      process.exit(1);
    }

    const variants = [];

    for (const metadataPath of variantDirs) {
      const variantDir = path.dirname(metadataPath);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Find HTML file in variant directory
      const htmlFiles = glob.sync(path.join(variantDir, '*.html'));
      if (htmlFiles.length === 0) continue;

      const htmlFile = htmlFiles[0];
      const htmlFilename = path.basename(htmlFile);
      const variantName = path.basename(variantDir);

      // Copy HTML file to output
      const outputHtmlPath = path.join(outputDir, htmlFilename);
      fs.copyFileSync(htmlFile, outputHtmlPath);

      variants.push({
        name: metadata.name || variantName,
        agent: metadata.agent,
        description: metadata.description || '',
        previewUrl: htmlFilename,
        sourceUrl: htmlFilename,
        theme: metadata.theme,
        timestamp: metadata.timestamp
      });
    }

    // Generate gallery-data.json
    const galleryData = {
      generated: new Date().toISOString(),
      variants: variants
    };

    const galleryDataPath = path.join(outputDir, 'gallery-data.json');
    fs.writeFileSync(galleryDataPath, JSON.stringify(galleryData, null, 2));

    // Copy gallery template to output
    const templatePath = path.join(__dirname, 'gallery-template.html');
    const outputTemplatePath = path.join(outputDir, 'gallery.html');
    
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, outputTemplatePath);
    } else {
      console.warn('gallery-template.html not found at', templatePath);
    }

    console.log(`Generated gallery with ${variants.length} variants`);
    console.log(`Gallery saved to: ${path.join(outputDir, 'gallery.html')}`);

    // Try to open in browser
    try {
      await open(outputTemplatePath);
    } catch (err) {
      console.log(`To view gallery, open: ${outputTemplatePath}`);
    }

  } catch (err) {
    console.error('Error generating gallery:', err.message);
    process.exit(1);
  }
}

main();
