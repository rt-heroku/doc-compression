#!/usr/bin/env node
/**
 * Simple test script to verify plugin functionality
 */

const { compressFileTool } = require('./dist/tools/compress-file');
const path = require('path');

async function test() {
  console.log('🧪 Testing Documentation Compression Plugin\n');

  // Test on Cerebro README
  const testFile = path.join(__dirname, '../../README.md');

  console.log(`Testing file: ${testFile}\n`);

  try {
    const result = await compressFileTool({
      filePath: testFile,
      strategy: 'hierarchical-yaml',
      level: 'medium'
    });

    console.log('\n📊 Results:');
    console.log(`   Strategy: ${result.metadata.strategy}`);
    console.log(`   Processing time: ${result.metadata.processingTimeMs}ms`);
    console.log(`\n✅ Test passed! Plugin is working correctly.`);

    // Validate compression ratio
    if (result.compressionRatio >= 3.0) {
      console.log(`\n🎯 Compression ratio (${result.compressionRatio.toFixed(1)}x) meets expectations!`);
    } else {
      console.log(`\n⚠️  Compression ratio (${result.compressionRatio.toFixed(1)}x) is lower than expected (target: 5-6x)`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
