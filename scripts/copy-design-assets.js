const fs = require('fs');
const path = require('path');

const srcBase = 'c:\\Users\\naiti\\Downloads\\stitch_visroslot_saas_landing_page (1)\\stitch_visroslot_saas_landing_page';
const destBase = 'C:\\Users\\naiti\\Downloads\\stitch_restaurant_qr_saas_platform\\public\\assets';

const copies = [
  { from: 'boutique_pilates_and_personal_fitness_training_studio_polished_timber_floor\\screen.png', to: 'industry-fitness.png' },
  { from: 'high_end_modern_aesthetic_hair_salon_and_barbershop_interior_with_minimalist\\screen.png', to: 'industry-salon.png' },
  { from: 'luxury_organic_wellness_spa_and_massage_retreat_interior_stone_and_eucalyptus\\screen.png', to: 'industry-spa.png' },
  { from: 'modern_clean_dental_and_medical_wellness_clinic_examination_room_serene\\screen.png', to: 'industry-clinic.png' },
  { from: 'sophisticated_consultant_and_advisory_office_meeting_suite_architectural_glass\\screen.png', to: 'industry-consulting.png' },
  { from: 'visroslot_home_luxury_emerald_experience\\screen.png', to: 'preview-hero-emerald.png' },
  { from: 'visroslot_luxury_corporate_saas_landing_page\\screen.png', to: 'preview-dashboard-luxury.png' },
  { from: 'visroslot_7_step_customer_booking_experience\\screen.png', to: 'preview-booking-experience.png' },
  { from: 'visroslot_business_owner_sign_up_6_step_onboarding_wizard\\screen.png', to: 'preview-onboarding-wizard.png' }
];

copies.forEach(({ from, to }) => {
  const fullFrom = path.join(srcBase, from);
  const fullTo = path.join(destBase, to);
  if (fs.existsSync(fullFrom)) {
    fs.copyFileSync(fullFrom, fullTo);
    console.log(`Copied ${to} (${fs.statSync(fullTo).size} bytes)`);
  } else {
    console.warn(`File not found: ${fullFrom}`);
  }
});
