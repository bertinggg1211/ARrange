#!/usr/bin/env node

/**
 * Comprehensive Chat Diagnostics Runner
 * 
 * This script runs all the diagnostic tests to identify and resolve chat issues:
 * 1. Database connection test
 * 2. Messages table schema verification
 * 3. Manual database query test
 * 4. Specific seller ID query test
 * 5. Error logging verification
 */

// Load environment variables
require('dotenv').config();

// Check for environment variables first
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('📝 Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.error('\n🔧 QUICK SETUP:');
  console.error('1. Create a .env file in the server directory');
  console.error('2. Add your Supabase credentials:');
  console.error('   SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   SUPABASE_SERVICE_KEY=your_service_role_key_here');
  console.error('3. Get credentials from: Supabase Dashboard > Settings > API');
  console.error('4. Run this script again');
  console.error('\n📖 For detailed instructions, see: ENVIRONMENT_SETUP_GUIDE.md');
  process.exit(1);
}

const diagnoseChatIssues = require('./diagnose-chat-issues');
const verifyMessagesSchema = require('./verify-messages-schema');
const testSpecificSellerQuery = require('./test-specific-seller-query');

async function runAllDiagnostics() {
  console.log('🚀 Starting comprehensive chat diagnostics...');
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.log('='.repeat(80));

  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      criticalIssues: [],
      warnings: [],
      recommendations: []
    }
  };

  try {
    // Test 1: Comprehensive chat issues diagnosis
    console.log('\n🔍 TEST 1: Comprehensive Chat Issues Diagnosis');
    console.log('-'.repeat(50));
    results.tests.diagnosis = await diagnoseChatIssues();
    results.summary.totalTests++;
    
    if (results.tests.diagnosis.success) {
      console.log('✅ Diagnosis test passed');
      results.summary.passedTests++;
    } else {
      console.log('❌ Diagnosis test failed');
      results.summary.failedTests++;
      results.summary.criticalIssues.push({
        test: 'diagnosis',
        issue: results.tests.diagnosis.issue,
        message: results.tests.diagnosis.message
      });
    }

    // Test 2: Messages schema verification
    console.log('\n🔍 TEST 2: Messages Schema Verification');
    console.log('-'.repeat(50));
    results.tests.schema = await verifyMessagesSchema();
    results.summary.totalTests++;
    
    if (results.tests.schema.success) {
      console.log('✅ Schema verification test passed');
      results.summary.passedTests++;
    } else {
      console.log('❌ Schema verification test failed');
      results.summary.failedTests++;
      results.summary.criticalIssues.push({
        test: 'schema',
        issue: results.tests.schema.issue,
        message: results.tests.schema.message
      });
    }

    // Test 3: Specific seller query test
    console.log('\n🔍 TEST 3: Specific Seller Query Test');
    console.log('-'.repeat(50));
    results.tests.specificQuery = await testSpecificSellerQuery();
    results.summary.totalTests++;
    
    if (results.tests.specificQuery.success) {
      console.log('✅ Specific seller query test passed');
      results.summary.passedTests++;
    } else {
      console.log('❌ Specific seller query test failed');
      results.summary.failedTests++;
      results.summary.criticalIssues.push({
        test: 'specificQuery',
        issue: results.tests.specificQuery.issue,
        message: results.tests.specificQuery.message
      });
    }

    // Generate recommendations based on results
    console.log('\n💡 GENERATING RECOMMENDATIONS...');
    
    if (results.tests.diagnosis && !results.tests.diagnosis.success) {
      if (results.tests.diagnosis.issue === 'TABLE_NOT_FOUND') {
        results.summary.recommendations.push({
          priority: 'CRITICAL',
          action: 'Create messages table',
          command: 'Run the chat database setup SQL script in Supabase dashboard',
          file: 'server/sql/create_chat_tables.sql'
        });
      }
    }
    
    if (results.tests.schema && !results.tests.schema.success) {
      if (results.tests.schema.issue === 'MISSING_COLUMNS') {
        results.summary.recommendations.push({
          priority: 'HIGH',
          action: 'Fix missing columns',
          command: 'Update messages table schema',
          details: `Missing columns: ${results.tests.schema.missingColumns?.join(', ')}`
        });
      }
    }
    
    if (results.tests.specificQuery && !results.tests.specificQuery.success) {
      if (results.tests.specificQuery.issue === 'SELLER_NOT_FOUND') {
        results.summary.recommendations.push({
          priority: 'MEDIUM',
          action: 'Check seller data',
          command: 'Verify seller ID exists in users table',
          details: 'Seller ID may be invalid or deleted'
        });
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE DIAGNOSTICS COMPLETE');
    console.log('='.repeat(80));
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Total Tests: ${results.summary.totalTests}`);
    console.log(`  Passed: ${results.summary.passedTests} ✅`);
    console.log(`  Failed: ${results.summary.failedTests} ❌`);
    
    if (results.summary.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      results.summary.criticalIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.test}: ${issue.issue}`);
        console.log(`     Message: ${issue.message}`);
      });
    }
    
    if (results.summary.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      results.summary.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
        console.log(`     Command: ${rec.command}`);
        if (rec.details) {
          console.log(`     Details: ${rec.details}`);
        }
        if (rec.file) {
          console.log(`     File: ${rec.file}`);
        }
      });
    }
    
    if (results.summary.failedTests === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Chat functionality should be working.');
    } else {
      console.log('\n⚠️ Some tests failed. Please address the issues above.');
    }

    // Save results to file
    const fs = require('fs');
    const resultsFile = `chat-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsFile}`);

    return results;

  } catch (error) {
    console.error('❌ CRITICAL ERROR during diagnostics:', error);
    console.error('❌ Error stack:', error.stack);
    
    results.summary.criticalIssues.push({
      test: 'diagnostics_runner',
      issue: 'SCRIPT_ERROR',
      message: error.message
    });
    
    return results;
  }
}

// Run if called directly
if (require.main === module) {
  runAllDiagnostics()
    .then(results => {
      console.log('\n🎯 FINAL RESULTS:');
      console.log(JSON.stringify(results, null, 2));
      process.exit(results.summary.failedTests === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Diagnostics runner failed:', error);
      process.exit(1);
    });
}

module.exports = runAllDiagnostics;
