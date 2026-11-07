const https = require("https");
const auth = "Basic " + Buffer.from("rzp_live_TvNjsnYOY9mDa8:q5G3JDDvpvbpdw31rDJqTd6Y").toString("base64");
const req = https.request({
  hostname: "api.razorpay.com",
  path: "/v1/subscriptions/sub_TwDvJ9Sj2pxZkg/cancel",
  method: "POST",
  headers: {
    Authorization: auth,
    "Content-Type": "application/json",
  },
}, (res) => {
  console.log("Cancelled test subscription. Status:", res.statusCode);
});
req.write(JSON.stringify({ cancel_at_cycle_end: 0 }));
req.end();
