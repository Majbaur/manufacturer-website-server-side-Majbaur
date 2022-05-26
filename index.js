const express = require("express");
const cors = require('cors');
const jwt =require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port=process.env.PORT || 5000
const app =express()

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s598z.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'unAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
      
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' });
        req.decoded = decoded;
        next();
        // console.log(decoded) // bar
      }
    });
  }


async function run(){
    try{
        await client.connect()
        // const serviceCollection = client.db("computerPartsHouse").collection("service");
        
        const productCollection = client.db("computerPartsHouse").collection("product");
        const addedItemCollection = client.db("computerPartsHouse").collection("addedItem");
        const userCollection = client.db("computerPartsHouse").collection("users");
        const orderCollection = client.db('computerPartsHouse').collection('order');
        
        // app.get('/service',async(rep,res)=>{
        //     const query={}
        //     const cursor=serviceCollection.find(query)
        //     const services=await cursor.toArray()
        //     res.send(services)
        // })
        
        // app.get('/order', verifyJWT, async (req, res) => {
        // app.get('/myorder',verifyJWT, async (req, res) => {
        //     const decodedEmail = req.decoded.email;
        //     const email = req.query.email;
        //     if (email === decodedEmail) {
        //         const query = { email: email };
        //         const cursor = orderCollection.find(query);
        //         const orders = await cursor.toArray();
        //         res.send(orders);
        //     }
        //     else{
        //         res.status(403).send({message: 'forbidden access'})
        //     }
        // })

        app.get('/order',async(req,res)=>{
            const query={}
            const cursor=orderCollection.find(query)
            const order=await cursor.toArray()
            res.send(order)
        });

        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        //user INformation // upsert
        app.put('/user/:email',async (req, res)=>{
            const email = req.params.email;
            const user = req.body;
            const filter = {email: email};
            const options = {upsert: true};
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        });


//add veryfyJWT, veryfyJWT, veryfyAdmin,
app.put('/user/admin/:email', async (req, res) => {
    const email = req.params.email;
    const requester = req.decoded.email;
    const requesterAccount = await userCollection.findOne({email: requester});

    if(requesterAccount.role==='admin'){

        const filter = { email: email };
    const updateDoc = {
      $set: { role: 'admin' },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
    }
    else{
        res.status(403).send({ message: 'forbidden'});
    }
    
    
  })




  


        //all user for mak admin
        app.get('/user', async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
          })


        app.get('/items', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);

            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            let items;

            if (page || size) 
            {

                items = await cursor.skip(page*size).limit(size).toArray();
            }

            else {
                items = await cursor.toArray();
            }

            res.send(items)
        })


        app.get('/itemsCount', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const count = await productCollection.estimatedDocumentCount();
            res.send({ count })
        })

        app.get("/item/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await productCollection.findOne(query);
            res.send(result);
        })


        app.put("/delivered/:id", async (req, res) => {
            const id = req.params.id;
            const updatedItem = req.body;

            console.log(updatedItem);

            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };

            const updatedDoc = {
                $set: {
                    Quantity: updatedItem.Quantity,
                    sale: updatedItem.sale
                }
            }

            const result = await productCollection.updateOne(filter, updatedDoc, options);

            res.send(result);

        })
        app.get('/delear',async(req,res)=>{
            const query={}
            const cursor=delearCollection.find(query)
            const delear=await cursor.toArray()
            res.send(delear)
        })

        app.put("/restock/:id", async (req, res) => {
            const id = req.params.id;
            const updatedItem = req.body;


            const filter = { _id: ObjectId(id) };

            const options = { upsert: true };

            const updatedDoc = {
                $set: {
                    Quantity: updatedItem.Quantity
                }
            }

            const result = await productCollection.updateOne(filter, updatedDoc, options);

            res.send(result);

        });

        //make an admin verify page
    app.get('/admin/:email', async (req, res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        const isAdmin = user.role === 'admin';
        res.send({ admin: isAdmin });
  
      })



        // app.post("/deleteitem" , async(req , res)=>
        // {
        //     const id = req.body;

        //     const result = await productCollection.deleteOne({ "_id" : ObjectId(id)})

        //     res.send(result)
        // })
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });
        
        //post ADD user Majba
        app.get('/addedItem' , async (req, res)=>{
            const cursor=addedItemCollection.find(query)
            const addedItems=await cursor.toArray()
            res.send(addedItems)
        })
        
        app.post('/addedItem',async (req, res) => {
            const newAddedItem = req.body;
            const result = await addedItemCollection.insertOne(newAddedItem);
            res.send(result)
        })
        app.delete('/addedItem/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await addedItemCollection.deleteOne(query);
            res.send(result);
        });
        

    }

    finally {
        /* await client.close(); */
    }
}
run().catch(console.dir)




app.get('/',(req,res)=>{
    res.send('services is Updating and waiting for New Arrival services')
})

app.listen(port,()=>{
    console.log('services is Updating on Website',port)
})




























































// const express = require("express");
// const cors = require('cors');
// // const jwt =require('jsonwebtoken')
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// require('dotenv').config()
// const port=process.env.PORT || 5000
// const app =express()

// // middleware
// app.use(cors())
// app.use(express.json())



// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s598z.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// async function run(){
//     try{
//         await client.connect()
//         // const serviceCollection = client.db("computerPartsHouse").collection("service");
        
//         const productCollection = client.db("computerPartsHouse").collection("product");
//         const addedItemCollection = client.db("computerPartsHouse").collection("addedItem");
//         const userCollection = client.db("computerPartsHouse").collection("users");
        
//         // app.get('/service',async(rep,res)=>{
//         //     const query={}
//         //     const cursor=serviceCollection.find(query)
//         //     const services=await cursor.toArray()
//         //     res.send(services)
//         // })


//         app.get('/items', async (req, res) => {
//             const query = {};
//             const cursor = productCollection.find(query);

//             const page = parseInt(req.query.page);
//             const size = parseInt(req.query.size);

//             let items;

//             if (page || size) 
//             {

//                 items = await cursor.skip(page*size).limit(size).toArray();
//             }

//             else {
//                 items = await cursor.toArray();
//             }

//             res.send(items)
//         })


//         app.get('/itemsCount', async (req, res) => {
//             const query = {};
//             const cursor = productCollection.find(query);
//             const count = await productCollection.estimatedDocumentCount();
//             res.send({ count })
//         })

//         app.get("/item/:id", async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: ObjectId(id) }
//             const result = await productCollection.findOne(query);
//             res.send(result);
//         })


//         app.put("/delivered/:id", async (req, res) => {
//             const id = req.params.id;
//             const updatedItem = req.body;

//             console.log(updatedItem);

//             const filter = { _id: ObjectId(id) };

//             const options = { upsert: true };

//             const updatedDoc = {
//                 $set: {
//                     Quantity: updatedItem.Quantity,
//                     sale: updatedItem.sale
//                 }
//             }

//             const result = await productCollection.updateOne(filter, updatedDoc, options);

//             res.send(result);

//         })
//         app.get('/delear',async(req,res)=>{
//             const query={}
//             const cursor=delearCollection.find(query)
//             const delear=await cursor.toArray()
//             res.send(delear)
//         })

//         app.put("/restock/:id", async (req, res) => {
//             const id = req.params.id;
//             const updatedItem = req.body;


//             const filter = { _id: ObjectId(id) };

//             const options = { upsert: true };

//             const updatedDoc = {
//                 $set: {
//                     Quantity: updatedItem.Quantity
//                 }
//             }

//             const result = await productCollection.updateOne(filter, updatedDoc, options);

//             res.send(result);

//         })



//         // app.post("/deleteitem" , async(req , res)=>
//         // {
//         //     const id = req.body;

//         //     const result = await productCollection.deleteOne({ "_id" : ObjectId(id)})

//         //     res.send(result)
//         // })
//         app.delete('/product/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: ObjectId(id) };
//             const result = await productCollection.deleteOne(query);
//             res.send(result);
//         });
        
//         //post ADD user Majba
//         app.get('/addedItem' , async (req, res)=>{
//             const email=req.query.email
//             const query={email: email}
//             const cursor=addedItemCollection.find(query)
//             const addedItems=await cursor.toArray()
//             res.send(addedItems)
//         })
        
//         app.post('/addedItem',async (req, res) => {
//             const newAddedItem = req.body;
//             const result = await addedItemCollection.insertOne(newAddedItem);
//             res.send(result)
//         })
//         app.delete('/addedItem/:id', async (req, res) => {
//             const id = req.params.id;
//             const query = { _id: ObjectId(id) };
//             const result = await addedItemCollection.deleteOne(query);
//             res.send(result);
//         });
//         app.get('/addedItem' , async (req, res)=>{
//             const email=req.query.email
//             const query={email: email}
//             const addedItems=await addedItemCollection.find(query).toArray()
//             res.send(addedItems)
//         })

//     }

//     finally {
//         /* await client.close(); */
//     }
// }
// run().catch(console.dir)




// app.get('/',(req,res)=>{
//     res.send('services is Updating and waiting for New Arrival services')
// })

// app.listen(port,()=>{
//     console.log('services is Updating on Website',port)
// })