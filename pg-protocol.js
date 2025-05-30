const net = require("net");
// const { buffer } = require("stream/consumers");
const config = {
  host: "localhost",
  port: 5432,
  password: "sanjay",
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

const createPasswordMessage = () => {
  const passwordBuf = Buffer.from(config.password + "\0");
  const lenthBuf = Buffer.alloc(4);
  lenthBuf.writeInt32BE(passwordBuf.length + 4);
  let pgPassword = Buffer.concat([Buffer.from("p"), lenthBuf, passwordBuf]);
  console.log(pgPassword, " this is my password for Postgres");
  return pgPassword;
};

 const sendQuery=()=>{
  let query='SELECT now()'
  let queryBuf= Buffer.from(query + '\0' );
  let lengthOfQueryBuf=Buffer.alloc(4);
  lengthOfQueryBuf.writeInt32BE(queryBuf.length+4);
  let finalQueryBuf=Buffer.concat([Buffer.from('Q'),lengthOfQueryBuf,queryBuf]);
  return finalQueryBuf;
 }


 function parseRowDescription(payload) {
  const fieldCount = payload.readUInt16BE(0);
  let offset = 2;
  const fieldNames = [];

  for (let i = 0; i < fieldCount; i++) {
    const end = payload.indexOf(0, offset);
    const name = payload.slice(offset, end).toString();
    fieldNames.push(name);
    offset = end + 19; // skip name + 18 bytes of metadata
  }

  return fieldNames;
}

function parseDataRow(payload) {
  const fieldCount = payload.readUInt16BE(0);
  let offset = 2;
  const fields = [];

  for (let i = 0; i < fieldCount; i++) {
    const len = payload.readInt32BE(offset);
    offset += 4;
    if (len === -1) {
      fields.push(null);
    } else {
      const val = payload.slice(offset, offset + len).toString();
      fields.push(val);
      offset += len;
    }
  }

  return fields;
}

const client = net.createConnection(
  { host: config.host, port: config.port },
  () => {
    console.log("Connecting to the Host ");
    let payload = createStartUpMessages();
    client.write(payload);
    //
    // if there is 3 in this buffer server is asking for the password
  }
);
let ready = false;
let fieldNames=[];
client.on("data", (msg) => {
  console.log("Message from the DB ", msg);
  console.log("========================================");
  let offSet = 0;
  while (offSet < msg.length) {
// console.log(" CURRENT VALUE OF OFFSET ", offSet);
    let responseMsgType = msg.toString("utf-8", offSet, offSet+1);
    offSet++;
    console.log(responseMsgType, " this the Response Msg Type");

    let responseLength = msg.readInt32BE(offSet);
    offSet += 4;

    let responseBody = msg.slice(offSet, offSet + responseLength - 4); //slicing the first part of payload to read it further
    offSet += responseLength - 4; //move to next msg

    if (responseMsgType == "R") {
      // asking for authentication{}
      // console.log(responseBody, " this is the responseBOdy");
      const authType = responseBody.readInt32BE(0);
      if (authType == 0) {
        //Authentication SUccessful
        console.log("========================================");
        console.log("Authentication SUccessful");
        console.log("========================================");
      } else if (authType == 3) {
        //asking for clearTextPassword
        console.log("========================================");
        client.write(createPasswordMessage());
        console.log("Password Sent Successful");
        console.log("========================================");
      } else {
        // asking for any other type of password
      }
    } else if (responseMsgType == "Z") {
        if (!ready) {
        ready = true;
          client.write(sendQuery());
      }
      // client.write(sendQuery())
    
      // console.log(" Ready FOR QUERY MESSAGE");
      //send your query here

    } else if (responseMsgType === "S") {
      // console.log(" I am here in S")
      // ParameterStatus - ignore for now
    } else if (responseMsgType === "K") {
      // BackendKeyData - ignore for now
      // console.log(" I am here in K")

    }
     else if (responseMsgType === 'T') {
      fieldNames = parseRowDescription(responseBody);
      console.log(fieldNames)
    }else if (responseMsgType === 'D') {
      const row = parseDataRow(responseBody);
      const result = {};
      fieldNames.forEach((name, i) => {
        result[name] = row[i];
      });
      console.log('🟢 Row:', result);
    }
    else if (responseMsgType === 'C') {
      const tag = responseBody.toString();
      console.log('✅ Command complete:', tag);
    }
    // console.log(" CURRENT VALUE OF OFFSET in WHILE LOOP END", offSet);
  }
  // console.log(" CURRENT VALUE OF OFFSET OUTSIDE WHILE LOOP ", offSet);
});

client.on("error", (err) => {
  console.error(" ERROR: Something Went Wrong", err);
});

client.on("end", () => {
  console.warn("🔚 Connection ended");
});
