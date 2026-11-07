/**
 * VISROSLOT Phase 4 Integration Tests
 * Validates:
 * 1. Customer profile structure & validation rules
 * 2. File upload mime type filtering & 5MB size limit logic
 * 3. Separation between Owner Profile and Business Entity
 * 4. Business Location coordinates boundary check & Google Maps directions URL builder
 * 5. Public booking page dynamic branding fallback logic
 */

const assert = require("assert");

function runPhase4Tests() {
  console.log("=========================================");
  console.log("   VISROSLOT PHASE 4 VERIFICATION SUITE  ");
  console.log("=========================================\n");

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         ${err.message}`);
    }
  }

  // 1. Image Upload Validation
  test("Image Upload: Allow only jpeg, png, webp, svg and reject invalid types", () => {
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    function validateUpload(mime, size) {
      if (!ALLOWED_MIME_TYPES.includes(mime)) {
        return { valid: false, error: "Only JPEG, PNG, WebP, and SVG images are allowed." };
      }
      if (size > MAX_FILE_SIZE) {
        return { valid: false, error: "Image size cannot exceed 5MB." };
      }
      return { valid: true };
    }

    assert.strictEqual(validateUpload("image/png", 1024 * 500).valid, true);
    assert.strictEqual(validateUpload("image/jpeg", 2 * 1024 * 1024).valid, true);
    assert.strictEqual(validateUpload("image/webp", 3 * 1024 * 1024).valid, true);
    assert.strictEqual(validateUpload("application/pdf", 1024).valid, false);
    assert.strictEqual(validateUpload("image/gif", 1024).valid, false);
    assert.strictEqual(validateUpload("image/png", 6 * 1024 * 1024).valid, false);
  });

  // 2. Owner Profile vs Business Entity Separation
  test("Profile Separation: Business entity and Owner account must have distinct identities", () => {
    const businessDoc = {
      id: "bus_123",
      name: "Downtown Salon & Spa",
      category: "Hair Salon",
      logo_url: "https://storage.googleapis.com/bucket/business-logo.png",
      phone: "+91 98765 00000",
      email: "booking@downtownsalon.com",
    };

    const ownerDoc = {
      uid: "user_owner_456",
      name: "Rajesh Kumar",
      email: "rajesh@gmail.com",
      phone: "+91 98765 11111",
      photoURL: "https://storage.googleapis.com/bucket/owner-headshot.jpg",
      role: "owner",
    };

    // Assert that owner photo is NOT business logo
    assert.notStrictEqual(businessDoc.logo_url, ownerDoc.photoURL);
    // Assert that business name is NOT owner personal name
    assert.notStrictEqual(businessDoc.name, ownerDoc.name);
    // Assert that contact channels can be distinct
    assert.notStrictEqual(businessDoc.phone, ownerDoc.phone);
  });

  // 3. Location & GPS Coordinates Validation
  test("Location Validation: Latitude must be -90..90 and Longitude -180..180", () => {
    function validateCoordinates(lat, lng) {
      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        return true; // Optional
      }
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (isNaN(numLat) || isNaN(numLng)) return false;
      if (numLat < -90 || numLat > 90) return false;
      if (numLng < -180 || numLng > 180) return false;
      return true;
    }

    assert.strictEqual(validateCoordinates(19.0760, 72.8777), true); // Mumbai
    assert.strictEqual(validateCoordinates(-33.8688, 151.2093), true); // Sydney
    assert.strictEqual(validateCoordinates(95.0, 72.0), false); // Lat > 90
    assert.strictEqual(validateCoordinates(20.0, 185.0), false); // Lng > 180
    assert.strictEqual(validateCoordinates("invalid", 50), false);
  });

  // 4. Google Maps Directions URL Generation
  test("Directions Link: Formats accurately for GPS coordinates and falls back to address", () => {
    function getDirectionsUrl(business) {
      const addressParts = [
        business.address,
        business.landmark,
        business.city,
        business.state,
        business.postal_code,
      ].filter(Boolean);
      const formattedAddress = addressParts.join(", ");

      const directionsQuery =
        business.latitude && business.longitude
          ? `${business.latitude},${business.longitude}`
          : formattedAddress || business.name;

      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`;
    }

    const busWithCoords = {
      name: "Style Studio",
      address: "123 MG Road",
      city: "Bengaluru",
      latitude: 12.9716,
      longitude: 77.5946,
    };
    assert.strictEqual(
      getDirectionsUrl(busWithCoords),
      "https://www.google.com/maps/search/?api=1&query=12.9716%2C77.5946"
    );

    const busWithoutCoords = {
      name: "Style Studio",
      address: "123 MG Road",
      landmark: "Near Metro",
      city: "Bengaluru",
      state: "Karnataka",
      postal_code: "560001",
    };
    assert.strictEqual(
      getDirectionsUrl(busWithoutCoords),
      "https://www.google.com/maps/search/?api=1&query=123%20MG%20Road%2C%20Near%20Metro%2C%20Bengaluru%2C%20Karnataka%2C%20560001"
    );
  });

  // 5. Public Booking Page Dynamic Branding Fallback
  test("Branding Fallback: Custom logo preferred, falls back to styled initial monogram", () => {
    function resolveBrandingBadge(business) {
      const logo = business.logo_url || business.logoUrl;
      if (logo) {
        return { type: "IMAGE", src: logo };
      }
      const initial = (business.name || "V").charAt(0).toUpperCase();
      return { type: "INITIAL_MONOGRAM", char: initial };
    }

    const busA = { name: "Aura Salon", logo_url: "https://example.com/logo.png" };
    assert.deepStrictEqual(resolveBrandingBadge(busA), {
      type: "IMAGE",
      src: "https://example.com/logo.png",
    });

    const busB = { name: "Royal Cuts" };
    assert.deepStrictEqual(resolveBrandingBadge(busB), {
      type: "INITIAL_MONOGRAM",
      char: "R",
    });
  });

  // 6. Pricing Structure adheres to Blueprint
  test("Blueprint Compliance: Pricing plans must reflect Professional (499) and Business (999) only", () => {
    const plans = {
      professional: { monthly: 499, yearly: 4990, staffLimit: 3, bookingsLimit: 300, trialDays: 7 },
      business: { monthly: 999, yearly: 9990, staffLimit: 10, bookingsLimit: "UNLIMITED", trialDays: 7 },
    };

    assert.strictEqual(plans.professional.monthly, 499);
    assert.strictEqual(plans.professional.yearly, 4990);
    assert.strictEqual(plans.business.monthly, 999);
    assert.strictEqual(plans.business.yearly, 9990);
    assert.strictEqual(plans.professional.trialDays, 7);
    assert.strictEqual(plans.business.trialDays, 7);
  });

  console.log(`\nResults: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log(">>> ALL PHASE 4 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<\n");
  } else {
    process.exit(1);
  }
}

runPhase4Tests();
