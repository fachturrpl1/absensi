#!/usr/bin/env node

/**
 * Script untuk verify konfigurasi Google OAuth
 * Jalankan dengan: node scripts/verify-oauth-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Google OAuth Configuration...\n');

// Check environment variables
console.log('✅ Step 1: Checking Environment Variables');
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('   Create .env.local with:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://oxkuxwkehinhyxfsauqe.supabase.co');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('   NEXT_PUBLIC_SITE_URL=http://localhost:3000\n');
} else {
  console.log('✓ .env.local found');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const hasSiteUrl = envContent.includes('NEXT_PUBLIC_SITE_URL');
  
  if (hasSupabaseUrl) {
    console.log('  ✓ NEXT_PUBLIC_SUPABASE_URL configured');
  } else {
    console.log('  ❌ NEXT_PUBLIC_SUPABASE_URL missing');
  }
  
  if (hasAnonKey) {
    console.log('  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY configured');
  } else {
    console.log('  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
  }
  
  if (hasSiteUrl) {
    console.log('  ✓ NEXT_PUBLIC_SITE_URL configured');
  } else {
    console.log('  ⚠️  NEXT_PUBLIC_SITE_URL not set (optional, defaults to http://localhost:3000)');
  }
}

// Check auth action
console.log('\n✅ Step 2: Checking Auth Actions');
const authPath = path.join(__dirname, '..', 'src', 'action', 'users.ts');
if (fs.existsSync(authPath)) {
  console.log('✓ users.ts found');
  const authContent = fs.readFileSync(authPath, 'utf-8');
  
  if (authContent.includes('signInWithGoogle')) {
    console.log('  ✓ signInWithGoogle function exists');
  } else {
    console.log('  ❌ signInWithGoogle function not found');
  }
  
  if (authContent.includes('signInWithOAuth')) {
    console.log('  ✓ signInWithOAuth configured');
  } else {
    console.log('  ❌ signInWithOAuth not configured');
  }
} else {
  console.log('❌ users.ts not found');
}

// Check callback route
console.log('\n✅ Step 3: Checking OAuth Callback Route');
const callbackPath = path.join(__dirname, '..', 'src', 'app', 'auth', 'callback', 'route.ts');
if (fs.existsSync(callbackPath)) {
  console.log('✓ OAuth callback route exists');
  const callbackContent = fs.readFileSync(callbackPath, 'utf-8');
  
  if (callbackContent.includes('exchangeCodeForSession')) {
    console.log('  ✓ exchangeCodeForSession implemented');
  } else {
    console.log('  ❌ exchangeCodeForSession not implemented');
  }
} else {
  console.log('❌ OAuth callback route not found at src/app/auth/callback/route.ts');
}

// Check Google Button component
console.log('\n✅ Step 4: Checking Google Button Component');
const googleButtonPath = path.join(__dirname, '..', 'src', 'components', 'google-button.tsx');
if (fs.existsSync(googleButtonPath)) {
  console.log('✓ GoogleButton component exists');
} else {
  console.log('❌ GoogleButton component not found');
}

// Instructions
console.log('\n📋 Manual Configuration Checklist:');
console.log('\n1. Google Cloud Console:');
console.log('   □ OAuth 2.0 Client ID created');
console.log('   □ Authorized redirect URI set to:');
console.log('     https://oxkuxwkehinhyxfsauqe.supabase.co/auth/v1/callback');
console.log('   □ No other redirect URIs added');
console.log('   □ Client ID and Secret copied');

console.log('\n2. Supabase Dashboard (https://app.supabase.com/project/oxkuxwkehinhyxfsauqe):');
console.log('   □ Go to Authentication > Providers');
console.log('   □ Enable Google provider');
console.log('   □ Paste Client ID from Google Console');
console.log('   □ Paste Client Secret from Google Console');
console.log('   □ Save configuration');

console.log('\n3. Supabase URL Configuration:');
console.log('   □ Go to Authentication > URL Configuration');
console.log('   □ Set Site URL to: http://localhost:3000');
console.log('   □ Add Redirect URLs:');
console.log('     - http://localhost:3000/**');
console.log('     - https://yourdomain.com/** (for production)');

console.log('\n4. Testing:');
console.log('   □ Clear browser cache and cookies');
console.log('   □ Restart dev server: npm run dev');
console.log('   □ Try login at: http://localhost:3000/auth/login');

console.log('\n📚 For detailed instructions, see:');
console.log('   - docs/FIX_GOOGLE_OAUTH_ERROR.md');
console.log('   - docs/GOOGLE_OAUTH_SETUP.md\n');

console.log('🎯 Correct OAuth Flow:');
console.log('   User → Google OAuth → Supabase Callback → Your App Callback → Homepage\n');
