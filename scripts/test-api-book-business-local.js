const { findBusinessBySlugRest, fetchCollectionRest, getStarterServicesForBusiness } = require('../src/lib/firebase/firestoreRest');

async function testSlug(slug) {
  console.log(`\n--- TESTING SLUG: "${slug}" ---`);
  const restBiz = await findBusinessBySlugRest(slug);
  if (!restBiz) {
    console.log("NOT FOUND!");
    return;
  }
  console.log("FOUND BIZ:", {
    id: restBiz.id,
    name: restBiz.name,
    slug: restBiz.slug,
    plan: restBiz.plan,
    subscription_status: restBiz.subscription_status
  });

  const allServices = await fetchCollectionRest("services");
  let services = allServices.filter(
    (s) => (s.business_id === restBiz.id || s.business_id === "2715CnLUsE7SU6ylo9EU") && s.is_active !== false
  );
  if (!services.length) {
    services = getStarterServicesForBusiness(restBiz.id, restBiz.name || "VISROSLOT Partner");
  }

  console.log(`SERVICES COUNT: ${services.length}`);
  console.log("SERVICES:", services.map(s => ({ id: s.id, name: s.name, price: s.price })));
}

async function run() {
  await testSlug("biz-9lvr45");
  await testSlug("biz-9Ivr45");
  await testSlug("demo-salon");
}

run();
