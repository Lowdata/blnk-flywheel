const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb+srv://slobo:0mfFYqqdl8LHEhWL@crud.ggux5ze.mongodb.net/blnk');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log("Users:", users);
  process.exit(0);
}

check();
