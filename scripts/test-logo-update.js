/**
 * VISROSLOT - Official Logo Replacement & Branding Verification Test Suite
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    testsFailed++;
  }
}

console.log('======================================================================');
console.log('VISROSLOT: OFFICIAL LOGO REPLACEMENT & BRANDING VERIFICATION SUITE');
console.log('======================================================================\n');

const projectRoot = path.resolve(__dirname, '..');

// 1. Verify Official Logo File
console.log('TEST 1: Official Logo Asset Verification');
const logoPath = path.join(projectRoot, 'public/assets/visroslot-logo.png');
assert(fs.existsSync(logoPath), 'Official logo exists at public/assets/visroslot-logo.png');
const stat = fs.statSync(logoPath);
assert(stat.size > 100000, `Official logo file size is valid (${stat.size} bytes)`);

// 2. Verify Favicon and Application Icons
console.log('\nTEST 2: Favicon & PWA Icons Verification');
const icoPath = path.join(projectRoot, 'public/favicon.ico');
const pngFavicon = path.join(projectRoot, 'public/favicon.png');
const appleTouch = path.join(projectRoot, 'public/apple-touch-icon.png');
const icon192 = path.join(projectRoot, 'public/icon-192.png');
const icon512 = path.join(projectRoot, 'public/icon-512.png');

assert(fs.existsSync(icoPath), 'favicon.ico exists in public directory');
assert(fs.existsSync(pngFavicon), 'favicon.png (32x32) exists in public directory');
assert(fs.existsSync(appleTouch), 'apple-touch-icon.png (180x180) exists in public directory');
assert(fs.existsSync(icon192), 'icon-192.png (192x192) exists in public directory');
assert(fs.existsSync(icon512), 'icon-512.png (512x512) exists in public directory');

const manifestSrc = fs.readFileSync(path.join(projectRoot, 'public/manifest.json'), 'utf8');
assert(manifestSrc.includes('icon-192.png') && manifestSrc.includes('icon-512.png'), 'manifest.json references updated icons');

// 3. Centralized Logo Component
console.log('\nTEST 3: Centralized PlatformLogo Component');
const platformLogoSrc = fs.readFileSync(path.join(projectRoot, 'src/components/brand/PlatformLogo.tsx'), 'utf8');
assert(platformLogoSrc.includes('variant = "compact"'), 'PlatformLogo supports default compact variant');
assert(platformLogoSrc.includes('variant === "full"'), 'PlatformLogo supports Version A (full circular logo)');
assert(platformLogoSrc.includes('PLATFORM_LOGO_ASSETS'), 'Centralized asset registry PLATFORM_LOGO_ASSETS exists');
assert(platformLogoSrc.includes('object-contain'), 'Version A uses object-contain for distortion-free rendering');

// 4. Version A: Full Circular Logo on Authentication & Splash Pages
console.log('\nTEST 4: Version A (Full Circular Logo) Usage');
const loginSrc = fs.readFileSync(path.join(projectRoot, 'src/app/login/page.tsx'), 'utf8');
assert(loginSrc.includes('variant="full"'), 'Login page renders Version A (Full Circular Logo)');

const registerSrc = fs.readFileSync(path.join(projectRoot, 'src/app/register/page.tsx'), 'utf8');
assert(registerSrc.includes('variant="full"'), 'Registration page renders Version A (Full Circular Logo)');

const forgotSrc = fs.readFileSync(path.join(projectRoot, 'src/app/forgot-password/page.tsx'), 'utf8');
assert(forgotSrc.includes('variant="full"'), 'Forgot password page renders Version A (Full Circular Logo)');

const resetSrc = fs.readFileSync(path.join(projectRoot, 'src/app/reset-password/page.tsx'), 'utf8');
assert(resetSrc.includes('variant="full"'), 'Reset password page renders Version A (Full Circular Logo)');

const verifyEmailSrc = fs.readFileSync(path.join(projectRoot, 'src/app/verify-email/page.tsx'), 'utf8');
assert(verifyEmailSrc.includes('variant="full"'), 'Verify email page renders Version A (Full Circular Logo)');

const superAdminLoginSrc = fs.readFileSync(path.join(projectRoot, 'src/app/super-admin/login/page.tsx'), 'utf8');
assert(superAdminLoginSrc.includes('variant="full"'), 'Super Admin login renders Version A (Full Circular Logo)');

// 5. Version B: Compact Logo on Navigation, Sidebars & Dashboards
console.log('\nTEST 5: Version B (Compact Logo) Usage');
const sidebarSrc = fs.readFileSync(path.join(projectRoot, 'src/components/dashboard/VisroSlotSidebar.tsx'), 'utf8');
assert(sidebarSrc.includes('VisroSlotLogo size="sm"'), 'Dashboard Sidebar renders compact logo');

const navbarSrc = fs.readFileSync(path.join(projectRoot, 'src/components/landing/Navbar.tsx'), 'utf8');
assert(navbarSrc.includes('VisroSlotLogo size="md"'), 'Landing Navbar renders compact logo');

const footerSrc = fs.readFileSync(path.join(projectRoot, 'src/components/landing/Footer.tsx'), 'utf8');
assert(footerSrc.includes('VisroSlotLogo size="md"'), 'Landing Footer renders compact logo');

const appLayoutSrc = fs.readFileSync(path.join(projectRoot, 'src/app/app/layout.tsx'), 'utf8');
assert(appLayoutSrc.includes('VisroSlotLogo size="sm"'), 'App dashboard header renders compact logo');

// 6. Customer AI and Owner AI Branding
console.log('\nTEST 6: Customer AI & Owner AI Logo Integration');
const customerAiEntrySrc = fs.readFileSync(path.join(projectRoot, 'src/components/booking/CustomerAiEntryScreen.tsx'), 'utf8');
assert(customerAiEntrySrc.includes('src="/assets/visroslot-logo.png"'), 'Customer AI Entry Screen displays official emblem');

const ownerAiPageSrc = fs.readFileSync(path.join(projectRoot, 'src/app/app/ai/page.tsx'), 'utf8');
assert(ownerAiPageSrc.includes('src="/assets/visroslot-logo.png"'), 'Owner AI dashboard displays official emblem');

// 7. Business Owner Logo Protection (Non-Negotiable)
console.log('\nTEST 7: Business Owner Logo Protection');
const bookingPageSrc = fs.readFileSync(path.join(projectRoot, 'src/app/book/[slug]/page.tsx'), 'utf8');
assert(bookingPageSrc.includes('business.logo_url') || bookingPageSrc.includes('businessLogo'), 'Booking page retrieves business custom logo');
assert(bookingPageSrc.includes('hasCustomLogo'), 'Booking page distinguishes business custom logo');
assert(bookingPageSrc.includes('alt={`${business.name} Logo`}'), 'Booking page renders business owner logo with dynamic alt text');

// 8. Email Templates
console.log('\nTEST 8: Email Template Branding');
const emailSenderSrc = fs.readFileSync(path.join(projectRoot, 'src/lib/email/sender.ts'), 'utf8');
assert(emailSenderSrc.includes('https://visroslot.netlify.app/assets/visroslot-logo.png'), 'Email template embeds official platform logo');
assert(emailSenderSrc.includes('EVERY SLOT. SIMPLIFIED.'), 'Email template features official tagline');

// 9. Root Layout Head Icons
console.log('\nTEST 9: Root Layout Head Configuration');
const rootLayoutSrc = fs.readFileSync(path.join(projectRoot, 'src/app/layout.tsx'), 'utf8');
assert(rootLayoutSrc.includes('/favicon.ico'), 'Root layout defines favicon.ico');
assert(rootLayoutSrc.includes('/apple-touch-icon.png'), 'Root layout defines apple-touch-icon');
assert(rootLayoutSrc.includes('/assets/visroslot-logo.png'), 'Root layout defines 1024x1024 logo icon');

console.log('\n======================================================================');
console.log(`LOGO VERIFICATION TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('======================================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('All logo replacement and branding requirements verified successfully!');
  process.exit(0);
}
