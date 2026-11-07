const https = require('https');

const data = JSON.stringify({
  businessId: "kFoRadrb9Rg2Guh4D23h",
  serviceId: "srv-demo-1",
  appointmentDate: "2026-11-06",
  startTime: "10:00",
  endTime: "10:35",
  customerName: "Raj Sharma",
  customerEmail: "rajkumar50036@gmail.com",
  customerPhone: "+919876543210",
  customerNotes: "Visroslot test appointment"
});

const req = https.request('https://visroslot.vercel.app/api/book/appointment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let b = '';
  res.on('data', c => b += c);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', b);
  });
});

req.write(data);
req.end();
