const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1].trim()] = val;
  }
});

const app = !getApps().length ? initializeApp({
  credential: cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
}) : getApps()[0];

const db = getFirestore(app);

async function seedDemoSalon() {
  console.log('Seeding demo-salon business in Firestore...');

  // Check if demo-salon already exists
  const existing = await db.collection('businesses').where('slug', '==', 'demo-salon').limit(1).get();
  let bizId;

  const bizData = {
    name: 'VISROSLOT Demo Salon & Wellness',
    slug: 'demo-salon',
    category: 'Salon & Wellness',
    description: 'Premier styling salon offering precision haircuts, luxury beard grooming, therapeutic facials, and complete aesthetic care.',
    phone: '+91 98765 43210',
    email: 'demo@visroslot.com',
    address: 'Suite 101, Luxury Boulevard, Bangalore',
    location: {
      address: 'Suite 101, Luxury Boulevard, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560001',
      latitude: 12.9716,
      longitude: 77.5946
    },
    is_active: true,
    lifetime_free: true,
    payment_verified: true,
    is_paid: true,
    subscription_status: 'active',
    owner_id: 'vMZQTGlYSfM8adohQAZmSE3cNX02',
    owner_email: 'rajkumar50036@gmail.com',
    buffer_time_mins: 15,
    advance_notice_hours: 1,
    booking_window_days: 30,
    cancellation_buffer_hours: 2,
    working_hours: {
      monday: { isOpen: true, open: '09:00', close: '20:00' },
      tuesday: { isOpen: true, open: '09:00', close: '20:00' },
      wednesday: { isOpen: true, open: '09:00', close: '20:00' },
      thursday: { isOpen: true, open: '09:00', close: '20:00' },
      friday: { isOpen: true, open: '09:00', close: '21:00' },
      saturday: { isOpen: true, open: '09:00', close: '21:00' },
      sunday: { isOpen: true, open: '10:00', close: '18:00' }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (existing.empty) {
    const docRef = await db.collection('businesses').add(bizData);
    bizId = docRef.id;
    console.log('✅ Created business doc with ID:', bizId);
  } else {
    bizId = existing.docs[0].id;
    await db.collection('businesses').doc(bizId).set(bizData, { merge: true });
    console.log('✅ Updated existing business doc with ID:', bizId);
  }

  // Add services for demo-salon
  const demoServices = [
    {
      name: 'Precision Haircut & Styling',
      duration: 35,
      price: 500,
      description: 'Consultation, precision scissor & clipper cut, wash, and luxury finish styling.',
      category: 'Hair Care',
      is_active: true,
      business_id: bizId,
      created_at: new Date().toISOString()
    },
    {
      name: 'Luxury Beard Grooming & Hot Towel',
      duration: 30,
      price: 350,
      description: 'Razor shaping, beard oil conditioning, and soothing hot towel relaxation.',
      category: 'Grooming',
      is_active: true,
      business_id: bizId,
      created_at: new Date().toISOString()
    },
    {
      name: 'Deep Cleansing & Glowing Facial',
      duration: 60,
      price: 1200,
      description: 'Skin exfoliation, blackhead extraction, rejuvenating massage, and organic gold mask.',
      category: 'Facial & Skin',
      is_active: true,
      business_id: bizId,
      created_at: new Date().toISOString()
    },
    {
      name: 'Complete Royal Spa & Grooming Package',
      duration: 90,
      price: 2499,
      description: 'Haircut, luxury facial, beard grooming, and head massage experience.',
      category: 'Packages',
      is_active: true,
      business_id: bizId,
      created_at: new Date().toISOString()
    }
  ];

  // Clean old demo services
  const servSnap = await db.collection('services').where('business_id', '==', bizId).get();
  for (const doc of servSnap.docs) {
    await doc.ref.delete();
  }

  for (const s of demoServices) {
    const sRef = await db.collection('services').add(s);
    console.log(`  Added service: ${s.name} (${sRef.id})`);
  }

  // Add staff for demo-salon
  const demoStaff = [
    {
      name: 'Priya Sharma',
      role: 'Senior Stylist & Skin Specialist',
      email: 'priya.stylist@visroslot.com',
      phone: '+91 98765 11111',
      business_id: bizId,
      is_active: true,
      assigned_services: [],
      working_hours: bizData.working_hours,
      created_at: new Date().toISOString()
    },
    {
      name: 'Rahul Verma',
      role: 'Master Barber & Grooming Expert',
      email: 'rahul.barber@visroslot.com',
      phone: '+91 98765 22222',
      business_id: bizId,
      is_active: true,
      assigned_services: [],
      working_hours: bizData.working_hours,
      created_at: new Date().toISOString()
    }
  ];

  const staffSnap = await db.collection('staff').where('business_id', '==', bizId).get();
  for (const doc of staffSnap.docs) {
    await doc.ref.delete();
  }

  for (const st of demoStaff) {
    const stRef = await db.collection('staff').add(st);
    console.log(`  Added staff: ${st.name} (${stRef.id})`);
  }

  // Add a sample completed review so Customer Reviews & Ratings displays
  const reviewSnap = await db.collection('reviews').where('business_id', '==', bizId).get();
  if (reviewSnap.empty) {
    await db.collection('reviews').add({
      business_id: bizId,
      customer_name: 'Ananya Roy',
      rating: 5,
      comment: 'Super fast booking with VISROSLOT Customer AI! Loved the precision haircut from Priya.',
      is_verified: true,
      created_at: new Date().toISOString()
    });
    console.log('  Added verified 5-star review');
  }

  console.log('\n🎉 DEMO SALON SUCCESSFULLY CONFIGURED!');
  console.log('URL: https://visroslot.netlify.app/book/demo-salon');
}

seedDemoSalon().catch(console.error);
