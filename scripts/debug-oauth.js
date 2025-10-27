#!/usr/bin/env node

/**
 * Debug script untuk Google OAuth
 * Jalankan: npm run debug-oauth
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 OAuth Debug Information\n');
console.log('═'.repeat(60));

// 1. Project Info
console.log('\n📦 PROJECT INFORMATION');
console.log('─'.repeat(60));
const packageJson = require(path.join(__dirname, '..', 'package.json'));
console.log(`Project: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);

// 2. Environment Variables
console.log('\n🔐 ENVIRONMENT VARIABLES');
console.log('─'.repeat(60));
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  console.log('✓ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Check Supabase URL
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  if (urlMatch) {
    console.log(`  SUPABASE_URL: ${urlMatch[1]}`);
  } else {
    console.log('  ❌ NEXT_PUBLIC_SUPABASE_URL not found');
  }
  
  // Check Anon Key (masked)
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);
  if (keyMatch) {
    const key = keyMatch[1];
    console.log(`  ANON_KEY: ${key.substring(0, 20)}...${key.substring(key.length - 10)} (masked)`);
  } else {
    console.log('  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
  }
  
  // Check Site URL
  const siteMatch = envContent.match(/NEXT_PUBLIC_SITE_URL=(.+)/);
  if (siteMatch) {
    console.log(`  SITE_URL: ${siteMatch[1]}`);
  } else {
    console.log('  ⚠️  NEXT_PUBLIC_SITE_URL not set (using default)');
  }
} else {
  console.log('❌ .env file not found');
}

if (fs.existsSync(envLocalPath)) {
  console.log('✓ .env.local file found');
} else {
  console.log('ℹ️  .env.local file not found (optional)');
}

// 3. Auth Configuration
console.log('\n🔑 AUTH CONFIGURATION');
console.log('─'.repeat(60));

const authPath = path.join(__dirname, '..', 'src', 'action', 'users.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf-8');
  
  console.log('✓ Auth actions file found');
  
  if (authContent.includes('signInWithGoogle')) {
    console.log('  ✓ signInWithGoogle function exists');
    
    // Check for scopes
    if (authContent.includes('scopes:')) {
      console.log('  ✓ OAuth scopes configured');
      const scopesMatch = authContent.match(/scopes:\s*['"]([^'"]+)['"]/);
      if (scopesMatch) {
        console.log(`    Scope: ${scopesMatch[1]}`);
      }
    } else {
      console.log('  ⚠️  OAuth scopes not configured');
    }
    
    // Check for queryParams
    if (authContent.includes('queryParams:')) {
      console.log('  ✓ OAuth queryParams configured');
      if (authContent.includes('access_type')) {
        console.log('    ✓ access_type set');
      }
      if (authContent.includes('prompt')) {
        console.log('    ✓ prompt set');
      }
    } else {
      console.log('  ⚠️  OAuth queryParams not configured');
    }
    
    // Check redirectTo
    if (authContent.includes('redirectTo:')) {
      console.log('  ✓ redirectTo configured');
      const redirectMatch = authContent.match(/redirectTo:\s*`([^`]+)`/);
      if (redirectMatch) {
        console.log(`    URL: ${redirectMatch[1]}`);
      }
    }
  } else {
    console.log('  ❌ signInWithGoogle function not found');
  }
} else {
  console.log('❌ Auth actions file not found');
}

// 4. Callback Route
console.log('\n🔄 CALLBACK ROUTE');
console.log('─'.repeat(60));

const callbackPath = path.join(__dirname, '..', 'src', 'app', 'auth', 'callback', 'route.ts');
if (fs.existsSync(callbackPath)) {
  const callbackContent = fs.readFileSync(callbackPath, 'utf-8');
  console.log('✓ Callback route found');
  
  if (callbackContent.includes('exchangeCodeForSession')) {
    console.log('  ✓ exchangeCodeForSession implemented');
  } else {
    console.log('  ❌ exchangeCodeForSession not found');
  }
  
  if (callbackContent.includes('NextResponse.redirect')) {
    console.log('  ✓ Redirect logic implemented');
  } else {
    console.log('  ⚠️  Redirect logic might be missing');
  }
} else {
  console.log('❌ Callback route not found');
  console.log('  Expected: src/app/auth/callback/route.ts');
}

// 5. Google Button Component
console.log('\n🔘 GOOGLE BUTTON COMPONENT');
console.log('─'.repeat(60));

const buttonPath = path.join(__dirname, '..', 'src', 'components', 'google-button.tsx');
if (fs.existsSync(buttonPath)) {
  const buttonContent = fs.readFileSync(buttonPath, 'utf-8');
  console.log('✓ GoogleButton component found');
  
  if (buttonContent.includes('signInWithGoogle')) {
    console.log('  ✓ Calls signInWithGoogle action');
  }
  
  if (buttonContent.includes('console.log') || buttonContent.includes('console.error')) {
    console.log('  ✓ Error logging enabled');
  }
  
  if (buttonContent.includes('window.location.href')) {
    console.log('  ✓ Redirect mechanism present');
  }
} else {
  console.log('❌ GoogleButton component not found');
}

// 6. Required URLs
console.log('\n🌐 REQUIRED URLS FOR SETUP');
console.log('─'.repeat(60));
console.log('\n📍 Supabase Project:');
console.log('  Dashboard: https://app.supabase.com/project/oxkuxwkehinhyxfsauqe');
console.log('  Auth Logs: https://app.supabase.com/project/oxkuxwkehinhyxfsauqe/logs/auth-logs');
console.log('  Providers: https://app.supabase.com/project/oxkuxwkehinhyxfsauqe/auth/providers');

console.log('\n📍 Google Cloud Console:');
console.log('  Dashboard: https://console.developers.google.com/');
console.log('  Credentials: https://console.developers.google.com/apis/credentials');
console.log('  Consent Screen: https://console.developers.google.com/apis/credentials/consent');

console.log('\n📍 Required Redirect URI for Google Console:');
console.log('  https://oxkuxwkehinhyxfsauqe.supabase.co/auth/v1/callback');
console.log('  ⚠️  ONLY THIS URL! Do not add other URLs!');

// 7. Common Issues
console.log('\n⚠️  COMMON ISSUES & SOLUTIONS');
console.log('─'.repeat(60));
console.log('\n1. "redirect_uri_mismatch"');
console.log('   → Check Google Console Authorized redirect URIs');
console.log('   → Must have: https://oxkuxwkehinhyxfsauqe.supabase.co/auth/v1/callback');
console.log('   → Remove all other redirect URIs');

console.log('\n2. "invalid_client"');
console.log('   → Check Client ID and Secret in Supabase Dashboard');
console.log('   → Re-copy from Google Console if needed');

console.log('\n3. "Access blocked: request is invalid"');
console.log('   → Check OAuth Consent Screen is configured');
console.log('   → Add test users (your email)');
console.log('   → Ensure status is "Testing" or "In production"');

console.log('\n4. "The developer hasn\'t given you access"');
console.log('   → Add your email to test users');
console.log('   → Wait 2-3 minutes after adding');

// 8. Next Steps
console.log('\n📋 NEXT STEPS');
console.log('─'.repeat(60));
console.log('\n1. Follow the checklist:');
console.log('   → docs/GOOGLE_CONSOLE_CHECKLIST.md');

console.log('\n2. Clear cache and test:');
console.log('   → rm -rf .next');
console.log('   → npm run dev');
console.log('   → Open incognito: http://localhost:3000/auth/login');

console.log('\n3. Check logs:');
console.log('   → Browser Console (F12)');
console.log('   → Supabase Auth Logs');
console.log('   → Terminal output');

console.log('\n4. If still failing:');
console.log('   → Take screenshot of Google Console Credentials');
console.log('   → Take screenshot of Supabase Provider config');
console.log('   → Copy browser console errors');
console.log('   → Share in support channel');

console.log('\n═'.repeat(60));
console.log('\n✅ Debug information collected!');
console.log('📚 See docs/GOOGLE_CONSOLE_CHECKLIST.md for detailed setup\n');
