const { spawn } = require("child_process");
const https = require("https");

const siteId = "51e56d78-8bda-4e06-b887-8d81d82a126a";
const token = "nfc_WAv9opBxreSNabsAA2Lvsfu9SjPGMk5k8ba8";

console.log("=========================================");
console.log("🚀 VISROSLOT PRODUCTION DEPLOYMENT STARTING");
console.log("Target site: https://visroslot.netlify.app");
console.log("Site ID: " + siteId);
console.log("=========================================");

const args = ["netlify", "deploy", "--site", siteId, "--auth", token, "--prod", "--no-build", "--json"];
console.log("Executing: npx " + args.join(" "));

const child = spawn("npx.cmd", args, {
  shell: true,
  env: process.env,
});

let stdout = "";
let stderr = "";

child.stdout.on("data", (data) => {
  const str = data.toString();
  stdout += str;
  // Print human readable progress lines
  const lines = str.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("{") && !trimmed.startsWith('"')) {
      console.log("[netlify]", trimmed);
    }
  }
});

child.stderr.on("data", (data) => {
  const str = data.toString();
  stderr += str;
  console.error("[netlify:err]", str.trim());
});

child.on("close", (code) => {
  console.log(`\nNetlify CLI exited with code ${code}`);

  if (code !== 0) {
    console.error("❌ Netlify CLI failed. stderr:", stderr);
    process.exit(code || 1);
  }

  let deployData;
  try {
    deployData = JSON.parse(stdout);
  } catch (e) {
    const match = stdout.match(/\{[\s\S]*"deploy_id"[\s\S]*\}/);
    if (match) {
      try {
        deployData = JSON.parse(match[0]);
      } catch (err2) {
        console.error("Could not parse matched json:", err2);
      }
    }
  }

  if (!deployData || !deployData.deploy_id) {
    console.error("❌ Could not extract deploy_id from Netlify output. Raw output snippet:\n", stdout.slice(-800));
    process.exit(1);
  }

  const deployId = deployData.deploy_id;
  console.log("✅ Deploy completed successfully!");
  console.log("Deploy ID:", deployId);
  console.log("Draft URL:", deployData.deploy_url);
  console.log("Logs URL: ", deployData.logs);

  console.log("\nPromoting deploy to Live Production (https://visroslot.netlify.app)...");

  const req = https.request(
    {
      hostname: "api.netlify.com",
      path: `/api/v1/sites/${siteId}/deploys/${deployId}/restore`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "VisroslotDeployer/2.0",
      },
    },
    (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log("Netlify publish HTTP status:", res.statusCode);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("\n=======================================================");
          console.log("🎉 SUCCESS: VISROSLOT IS LIVE ON PRODUCTION!");
          console.log("Live URL: https://visroslot.netlify.app");
          console.log("Deploy ID: " + deployId);
          console.log("=======================================================\n");
          process.exit(0);
        } else {
          console.error("❌ Production publish failed. Response:", body);
          process.exit(1);
        }
      });
    }
  );

  req.on("error", (err) => {
    console.error("❌ HTTP promotion error:", err);
    process.exit(1);
  });

  req.end();
});
