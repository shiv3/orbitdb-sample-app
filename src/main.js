const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')

const $=q=>document.querySelector(q)
const dbNameDefault = "/orbitdb/zdpuAu1F1mw6upY5iBsdERPfu9kPUb7RRgEHwXzd8MFGqjzZL/"
const defaultRoom = "techbookfest-autumn"
const SwarmAddresses = [
    "/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star"
]

const connectDB = async (dbName) => {
    const ipfs = await IPFS.create({
        EXPERIMENTAL: {
            pubsub: true
        },
        config: {
            Addresses: {
                Swarm: SwarmAddresses
            }
        },
    })
    const orbitdb = await OrbitDB.createInstance(ipfs,{create: true})
    const db = await orbitdb.log(dbName,{accessController: {write: ['*']}})
    // const db = await orbitdb.open(dbNameDefault+defaultRoom)
    await db.load()
    return db
}

const send = async (db,username,message,date) => await db.add({
    username:username,
    message:message,
    timestamp:date.getTime()
})

const sendMessage = async db =>{
    const username = $("#username").value
    const message = $("#message").value
    await send(db,username,message,(new Date()))
    await viewRender(db)
} 

const getDateTimeFormat = (date) => `${date.getFullYear()}/${date.getMonth()}/${date.getDate()} ${date.getHours()}:${date.getMinutes()>9?date.getMinutes():"0"+date.getMinutes()}:${date.getSeconds()>9?date.getSeconds():"0"+date.getSeconds()}`
const viewRender = async (db) =>{
    await db.load()
    const result = db.iterator({ limit: -1 }).collect()
        .map((e) => e.payload.value)
    console.log(result)
    $("#messages").innerHTML=`<tr><th>date</th><th>user_id</th><th>message</th></tr>`
    result.sort((a,b)=>a.timestamp-b.timestamp).forEach(v=>{
        const tr = document.createElement("tr");
        if(v.username != undefined && v.message != undefined){
            tr.innerHTML = `<td>${getDateTimeFormat(new Date(v.timestamp+0))}</td><td>${v.username}</td><td>${v.message}</td>`
            $("#messages").appendChild(tr)
        }
    })
}

const main = async() => {
    const db = await connectDB(defaultRoom)
    console.log(db.address.toString())
   
    $("#send").onclick=async() => await sendMessage(db)
    $("#reload").onclick=async()=>await viewRender(db)
    db.events.on('replicated',async() => await viewRender(db) )

    await viewRender(db)
}
main()

