const https = require("https");
const siteId = "51e56d78-8bda-4e06-b887-8d81d82a126a";
const token = "nfc_WAv9opBxreSNabsAA2Lvsfu9SjPGMk5k8ba8";

const req = https.request(
  {
    hostname: "api.netlify.com",
    path: `/api/v1/sites/${siteId}/deploys/6aeb43a374138c6712592d45`,
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "VisroslotDeployer/1.0",
    },
  },
  (res) => {
    let d = "";
    res.on("data", (c) => (d += c));
    res.on("end", () => {
      try {
        const dep = JSON.parse(d);
        console.log(
          JSON.stringify(
            {
              id: dep.id,
              state: dep.state,
              context: dep.context,
              deploy_url: dep.deploy_url,
              ssl_url: dep.ssl_url,
              url: dep.url,
              manual: dep.manual,
              summary: dep.summary,
            },
            null,
            2
          )
        );
      } catch (e) {
        console.error("Parse error:", e);
      }
    });
  }
);
req.on("error", console.error);
req.end();
