const https = require("https");
const { getRazorpayServerConfig, callRazorpayApi } = require("../src/lib/subscription/razorpayServer");

async function checkPlans() {
  console.log("Checking Razorpay live recurring plans...");
  const config = getRazorpayServerConfig();
  console.log("Using Key ID:", config.keyId);

  const plansToCheck = [
    { name: "Professional Monthly", id: config.plans.professional.monthly },
    { name: "Professional Yearly", id: config.plans.professional.yearly },
    { name: "Business Monthly", id: config.plans.business.monthly },
    { name: "Business Yearly", id: config.plans.business.yearly },
  ];

  for (const p of plansToCheck) {
    try {
      const planRes = await callRazorpayApi(`/plans/${p.id}`);
      console.log(`✅ [ACTIVE] ${p.name} (${p.id}):`, {
        period: planRes.period,
        interval: planRes.interval,
        item: planRes.item?.name,
        amount: planRes.item?.amount / 100 + " " + planRes.item?.currency,
      });
    } catch (e) {
      console.error(`❌ [ERROR] ${p.name} (${p.id}):`, e.message);
    }
  }
}

checkPlans();
