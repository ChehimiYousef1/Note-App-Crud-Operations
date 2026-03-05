const mongoose = require('mongoose');

const uri = 'mongodb://chehimi030_db_user:Test1234%40@ac-exhplgc-shard-00-00.tbdcjtf.mongodb.net:27017,ac-exhplgc-shard-00-01.tbdcjtf.mongodb.net:27017,ac-exhplgc-shard-00-02.tbdcjtf.mongodb.net:27017/myVirtualDatabase?ssl=true&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 })
  .then(() => { console.log('Connected!'); process.exit(0); })
  .catch(err => { console.log('Error:', err.message); process.exit(1); });