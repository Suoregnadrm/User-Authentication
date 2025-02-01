const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://bofaric545:JNrULAu9KoziZybt@cluster0.a7vwv2e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("users_db");
    const coll = db.collection("users");

    const docs = [
      {username: "admin", password:"admin"},
    ];

    const result = await coll.insertMany(docs);

    console.log(result.insertedIds);

  } finally {
    await client.close();
  }
}
run().catch(console.dir);
