const response = require("../res/res");
const { dumpError, queryDB, get, set, del, setex } = require("../conn/tabel");

let results;
let isCached = false;

exports.doublechecker = async (req, res) => {
  const noorder = req.body.noorder;
  const nodetail = req.body.nodetail;
  const norincian = req.body.norincian;
  const noroll = req.body.noroll;
  const kain = req.body.kain;
  const warna = req.body.warna;
  const lot = req.body.lot;

  req.body.ip = req.clientIp.slice(7);

  // console.log(req.body);
  // console.log("ip user", req.clientIp.slice(7));
  let key = JSON.stringify(req.body);
  let result = { no_order: "08523623", ip: "12312312" };
  let pesan;
  let test = await get(key);

  if (test === null) {
    await setex(key, 10, JSON.stringify(result));
    let test2 = await get(JSON.stringify(key));
    console.log("panggil database ", test2);
    pesan = "panggil database";
  } else {
    console.log("database tidak di panggil");
    pesan = "database tidak di panggil";
  }

  return response.ok(
    {
      status: 200,
      pesan: pesan,
    },
    200,
    res
  );
};

exports.getredis = async (req, res) => {
  let key = {
    noorder: "OR2356421",
    nodetail: "123",
    norincian: "135678",
    noroll: "R12356821",
    kain: "COMBED 30S",
    warna: "HITAM",
    lot: "123564",
    ip: "192.168.21.13",
  };
  let test = await get(JSON.stringify(key));
  console.log(test);

  return response.ok(
    {
      status: 200,
      pesan: test,
    },
    200,
    res
  );
};
