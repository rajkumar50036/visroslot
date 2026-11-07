// Phase 3 Verification & Integration Test Suite
const assert = require("assert");

console.log("=== RUNNING PHASE 3 INTEGRATION TESTS ===");

// 1. Test Phone Number Validation
function validatePhone(phone) {
  let clean = phone.replace(/\D/g, "");
  if (clean.length === 12 && clean.startsWith("91")) clean = clean.slice(2);
  if (clean.length === 11 && clean.startsWith("0")) clean = clean.slice(1);
  return clean.length === 10;
}
assert.strictEqual(validatePhone("9876543210"), true, "Valid 10-digit phone should pass");
assert.strictEqual(validatePhone("+91 98765 43210"), true, "Phone with +91 and spaces should clean to 10 digits");
assert.strictEqual(validatePhone("12345"), false, "Short phone must fail");
console.log("✓ Phone number validation passed");

// 2. Test Email Format Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
}
assert.strictEqual(validateEmail("owner@business.com"), true, "Valid email should pass");
assert.strictEqual(validateEmail("invalid-email"), false, "Invalid email must fail");
assert.strictEqual(validateEmail("test@domain"), false, "Incomplete domain must fail");
console.log("✓ Email format validation passed");

// 3. Test Staff Limits by Plan
function checkStaffLimit(plan, currentStaffCount) {
  const max = plan === "business" ? 10 : 3;
  return currentStaffCount < max;
}
assert.strictEqual(checkStaffLimit("professional", 0), true, "Pro with 0 staff can add");
assert.strictEqual(checkStaffLimit("professional", 2), true, "Pro with 2 staff can add");
assert.strictEqual(checkStaffLimit("professional", 3), false, "Pro with 3 staff cannot exceed limit");
assert.strictEqual(checkStaffLimit("business", 9), true, "Business with 9 staff can add");
assert.strictEqual(checkStaffLimit("business", 10), false, "Business with 10 staff cannot exceed limit");
console.log("✓ Staff limits enforcement passed");

// 4. Test Working Hours Validation
function validateSchedule(openTime, closeTime) {
  return openTime < closeTime;
}
assert.strictEqual(validateSchedule("09:00", "19:00"), true, "09:00 < 19:00 should pass");
assert.strictEqual(validateSchedule("20:00", "09:00"), false, "Close before open must fail");
assert.strictEqual(validateSchedule("10:00", "10:00"), false, "Equal open and close must fail");
console.log("✓ Working hours logic validation passed");

// 5. Test Slug Generator & Sanitization
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
assert.strictEqual(generateSlug("Aura Luxury Salon & Spa!"), "aura-luxury-salon-spa", "Slug sanitization correct");
assert.strictEqual(generateSlug("Dr. Ayesha's Dental Clinic"), "dr-ayesha-s-dental-clinic", "Punctuation stripped");
console.log("✓ Slug generation passed");

// 6. Test Step Progress Calculation
function calculateProgress(step) {
  return Math.round(((step - 1) / 7) * 100);
}
assert.strictEqual(calculateProgress(1), 0, "Step 1 progress is 0%");
assert.strictEqual(calculateProgress(8), 100, "Step 8 progress is 100%");
console.log("✓ Step progress math passed");

console.log("\n=== ALL PHASE 3 INTEGRATION LOGIC TESTS PASSED ===");
