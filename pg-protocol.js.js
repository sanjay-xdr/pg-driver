const net = require("net");
// const { buffer } = require("stream/consumers");
const config = {
  host: "localhost",
  port: 5432,
  password:"sanjay",
};

const readBuffer = (bufValue) => {
  const length = bufValue.readUInt32LE(0);
  const field = bufValue.readUInt32LE(4);
  const singleByte = bufValue.readUInt8(8);
  const mechanism = bufValue.toString("utf8", 9, 22);

  console.log("Length:", length);
  console.log("Field:", field);
  console.log("Single Byte:", singleByte);
  console.log("Mechanism:", mechanism);
};

const createStartUpMessages = () => {
  console.log(" Sending Startup Messages ");
  let userName = "postgres";
  let db = "Hotel";
  let protocolNumber = 196608;

  const params = ["user", userName, "database", db, "client_encoding", "UTF8"];
  let protocolBuffer = Buffer.alloc(4); // 00 00 00 00
  protocolBuffer.writeInt32BE(protocolNumber);

  const paramsBuffer = params.map((s) => Buffer.from(s + "\0"));
  let paramsBufferWithNull = paramsBuffer.concat(Buffer.from([0]));
  const finalParamsBuffer = Buffer.concat(paramsBufferWithNull.map((s) => s));
  const length = Buffer.alloc(4);
  length.writeInt32BE(4 + 4 + finalParamsBuffer.length);
  const body = Buffer.concat([length, protocolBuffer, finalParamsBuffer]);
  console.log(body, " final parameters to send");
  return body;
};


const createPasswordMessage=()=>{
  
  const passwordBuf= Buffer.from(config.password+"\0");
  const lenthBuf=Buffer.alloc(4);
  lenthBuf.writeInt32BE(passwordBuf.length+4);
  let pgPassword=Buffer.concat([Buffer.from('p')],lenthBuf,passwordBuf);
  console.log(pgPassword , " this is my password for Postgres");
  return pgPassword;

}



const client = net.createConnection(
  { host: config.host, port: config.port },
  () => {
    console.log("Connecting to the Host ");
    let payload = createStartUpMessages();
    client.write(payload);
    //read the payload

    // if there is 3 in this buffer server is asking for the password 
  }
);

client.on("data", (msg) => {
  console.log(" RECEIVED MESSAGE FROM DB ", msg);

  // readBuffer(msg);
});

client.on("error", (err) => {
  console.error(" ERROR: Something Went Wrong", err);
});

client.on("end", () => {
  console.warn("🔚 Connection ended");
});
