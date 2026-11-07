const https = require("https");

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    }).on("error", reject);
  });
}

async function main() {
  console.log("Testing live refund-token endpoint...");
  const res = await get("https://visroslot.netlify.app/api/subscription/refund-token");
  console.log("Status:", res.status);
  console.log("Body:", res.data);
}

main();
