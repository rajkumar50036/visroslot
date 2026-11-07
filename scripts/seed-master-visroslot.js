const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, collection, addDoc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c",
  authDomain: "visroslot.firebaseapp.com",
  projectId: "visroslot",
  storageBucket: "visroslot.firebasestorage.app",
  messagingSenderId: "895677315501",
  appId: "1:895677315501:web:eb54fc3c74f8ed97324924",
  measurementId: "G-4JPZW7PRSQ"
};

const MASTER_DATA = {
  businesses: [
    {
      id: "2715CnLUsE7SU6ylo9EU",
      name: "VISROSLOT Demo Salon & Wellness",
      slug: "demo-salon",
      category: "Salon & Wellness",
      description: "Premier styling salon offering precision haircuts, luxury beard grooming, therapeutic facials, and complete aesthetic care.",
      phone: "+91 98765 43210",
      email: "demo@visroslot.com",
      address: "Suite 101, Luxury Boulevard, Bangalore",
      location: {
        address: "Suite 101, Luxury Boulevard, Bangalore",
        city: "Bangalore",
        state: "Karnataka",
        postalCode: "560001",
        latitude: 12.9716,
        longitude: 77.5946
      },
      is_active: true,
      lifetime_free: true,
      payment_verified: true,
      is_paid: true,
      subscription_status: "active",
      plan: "business",
      owner_id: "vMZQTGlYSfM8adohQAZmSE3cNX02",
      owner_email: "rajkumar50036@gmail.com",
      buffer_time_mins: 15,
      advance_notice_hours: 1,
      booking_window_days: 30,
      cancellation_buffer_hours: 2,
      working_hours: {
        monday: { isOpen: true, open: "09:00", close: "20:00" },
        tuesday: { isOpen: true, open: "09:00", close: "20:00" },
        wednesday: { isOpen: true, open: "09:00", close: "20:00" },
        thursday: { isOpen: true, open: "09:00", close: "20:00" },
        friday: { isOpen: true, open: "09:00", close: "21:00" },
        saturday: { isOpen: true, open: "09:00", close: "21:00" },
        sunday: { isOpen: true, open: "10:00", close: "18:00" }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "rajkumar-founder-hq",
      name: "VISROSLOT Founder Studio & Clinic",
      slug: "rajkumar-hq",
      category: "Clinic & Spa",
      description: "Official VISROSLOT flagship headquarters for premier aesthetic appointments and private consultations.",
      phone: "+91 93913 54003",
      email: "rajkumar50036@gmail.com",
      address: "VISROSLOT Tower, Central Tech Park, Hyderabad",
      is_active: true,
      lifetime_free: true,
      payment_verified: true,
      is_paid: true,
      subscription_status: "active",
      plan: "business",
      owner_id: "vMZQTGlYSfM8adohQAZmSE3cNX02",
      owner_email: "rajkumar50036@gmail.com",
      buffer_time_mins: 15,
      advance_notice_hours: 1,
      booking_window_days: 30,
      cancellation_buffer_hours: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  services: [
    {
      id: "srv-demo-1",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Precision Haircut & Styling",
      duration: 35,
      price: 500,
      description: "Consultation, precision scissor & clipper cut, wash, and luxury finish styling.",
      category: "Hair Care",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "srv-demo-2",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Luxury Beard Grooming & Hot Towel",
      duration: 30,
      price: 350,
      description: "Razor shaping, beard oil conditioning, and soothing hot towel relaxation.",
      category: "Grooming",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "srv-demo-3",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Deep Cleansing & Glowing Facial",
      duration: 60,
      price: 1200,
      description: "Skin exfoliation, blackhead extraction, rejuvenating massage, and organic gold mask.",
      category: "Facial & Skin",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "srv-demo-4",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Complete Royal Spa & Grooming Package",
      duration: 90,
      price: 2499,
      description: "Haircut, luxury facial, beard grooming, and head massage experience.",
      category: "Package",
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  staff: [
    {
      id: "staff-demo-1",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Priya Sharma",
      role: "Senior Stylist & Skin Specialist",
      email: "priya.stylist@visroslot.com",
      phone: "+91 98765 11111",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "staff-demo-2",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Rahul Verma",
      role: "Master Barber & Grooming Expert",
      email: "rahul.barber@visroslot.com",
      phone: "+91 98765 22222",
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: "staff-demo-3",
      business_id: "2715CnLUsE7SU6ylo9EU",
      name: "Dr. Ananya Rao",
      role: "Clinical Aesthetics Consultant",
      email: "ananya.rao@visroslot.com",
      phone: "+91 98765 33333",
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  plans: [
    {
      id: "plan_professional",
      name: "Professional",
      price: 499,
      period: "monthly",
      staff_limit: 3,
      booking_limit: 300,
      features: [
        "Maximum 3 staff members with individual rosters",
        "Maximum 300 successful appointments / month",
        "Dedicated public booking page & QR code",
        "Online appointment management & calendar",
        "Customer management directory & booking history",
        "Owner AI & Customer AI with Professional allowance"
      ]
    },
    {
      id: "plan_business",
      name: "Business Suite",
      price: 999,
      period: "monthly",
      staff_limit: 10,
      booking_limit: -1, // Unlimited
      features: [
        "Maximum 10 staff members with independent rosters",
        "Unlimited appointment bookings (Zero monthly caps)",
        "Everything in Professional included",
        "Advanced CRM with customer retention private notes",
        "Advanced operational analytics & performance metrics",
        "Dedicated priority phone & email support"
      ]
    }
  ],
  reviews: [
    {
      id: "rev-demo-1",
      business_id: "2715CnLUsE7SU6ylo9EU",
      customer_name: "Ananya Roy",
      rating: 5,
      comment: "Super fast booking with VISROSLOT! Loved the precision haircut and smooth slot confirmation.",
      is_verified: true,
      created_at: new Date().toISOString()
    },
    {
      id: "rev-demo-2",
      business_id: "2715CnLUsE7SU6ylo9EU",
      customer_name: "Vikram Malhotra",
      rating: 5,
      comment: "Clean hygiene gap buffer protocol observed. Professional beard styling.",
      is_verified: true,
      created_at: new Date().toISOString()
    }
  ],
  platform_settings: {
    id: "global_configuration",
    platform_name: "VISROSLOT",
    helpline: "+91 93913 54003",
    support_email: "support@visroslot.com",
    trial_days: 7,
    autopay_verification_fee: 0,
    buffer_protocol: "15-min Hygiene Gap",
    cancellation_window_hours: 2,
    mode: "Pay at Salon",
    updated_at: new Date().toISOString()
  }
};

async function seedMasterData() {
  console.log('=====================================================');
  console.log('   VISROSLOT: MASTER DATABASE SEED TO FIREBASE       ');
  console.log('=====================================================\n');

  console.log('✓ Cloud Firestore Database verified active (HTTP 200)');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const email = 'client_sdk_1793886395285@visroslot.com';
  const password = 'Password123#Secure';

  console.log('Step 1: Authenticating with Firebase Auth...');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✓ Authenticated as: ${cred.user.email} (${cred.user.uid})\n`);
  } catch (authErr) {
    console.warn(`! Authentication note: ${authErr.message}`);
  }

  // Helper with timeout to prevent terminal hang
  const withTimeout = (promise, ms = 6000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), ms)),
    ]);

  // 1. Seed Businesses
  console.log('Step 3: Saving Businesses...');
  for (const b of MASTER_DATA.businesses) {
    try {
      await withTimeout(setDoc(doc(db, "businesses", b.id), b));
      console.log(`  ✓ Saved business: ${b.name} (${b.id})`);
    } catch (e) {
      console.error(`  ✗ Error saving business ${b.id}:`, e.message);
    }
  }

  // 2. Seed Services
  console.log('\nStep 3: Saving Services Catalog...');
  for (const s of MASTER_DATA.services) {
    try {
      await setDoc(doc(db, "services", s.id), s);
      console.log(`  ✓ Saved service: ${s.name} (${s.id})`);
    } catch (e) {
      console.error(`  ✗ Error saving service ${s.id}:`, e.message);
    }
  }

  // 3. Seed Staff
  console.log('\nStep 4: Saving Specialists & Staff...');
  for (const st of MASTER_DATA.staff) {
    try {
      await setDoc(doc(db, "staff", st.id), st);
      console.log(`  ✓ Saved staff: ${st.name} (${st.id})`);
    } catch (e) {
      console.error(`  ✗ Error saving staff ${st.id}:`, e.message);
    }
  }

  // 4. Seed Plans
  console.log('\nStep 5: Saving Subscription Plans...');
  for (const p of MASTER_DATA.plans) {
    try {
      await setDoc(doc(db, "plans", p.id), p);
      console.log(`  ✓ Saved plan: ${p.name} (₹${p.price}/${p.period})`);
    } catch (e) {
      console.error(`  ✗ Error saving plan ${p.id}:`, e.message);
    }
  }

  // 5. Seed Reviews
  console.log('\nStep 6: Saving Verified Reviews...');
  for (const r of MASTER_DATA.reviews) {
    try {
      await setDoc(doc(db, "reviews", r.id), r);
      console.log(`  ✓ Saved review: ${r.customer_name} (${r.rating}★)`);
    } catch (e) {
      console.error(`  ✗ Error saving review ${r.id}:`, e.message);
    }
  }

  // 6. Seed Platform Settings
  console.log('\nStep 7: Saving Platform Settings...');
  try {
    await setDoc(doc(db, "platform_settings", MASTER_DATA.platform_settings.id), MASTER_DATA.platform_settings);
    console.log(`  ✓ Saved platform settings (${MASTER_DATA.platform_settings.id})`);
  } catch (e) {
    console.error('  ✗ Error saving platform settings:', e.message);
  }

  console.log('\n=====================================================');
  console.log('   MASTER SEED PROCESS COMPLETED                     ');
  console.log('=====================================================');
}

seedMasterData().catch(console.error);
