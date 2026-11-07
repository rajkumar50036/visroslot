const https = require('https');
https.get('https://firestore.googleapis.com/v1/projects/visroslot/databases/(default)/documents/users/9Ivr45Y9mTYqwzAV8CX08kkeVJs1?key=AIzaSyDi1cHQO9OIuPJlr2qdERVJOjtp8sTv75c', (r) => {
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => console.log(JSON.stringify(JSON.parse(d), null, 2)));
});
