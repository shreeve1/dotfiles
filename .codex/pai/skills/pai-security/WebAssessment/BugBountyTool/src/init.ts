#!/usr/bin/env bun
// Initialize bug bounty tracker

import { BugBountyTracker } from './tracker.js';

async function main() {
  const tracker = new BugBountyTracker();

  try {
    await tracker.initialize();
  } catch (error) {
    console.error(' Initialization failed:', error);
    process.exit(1);
  }
}

main();
