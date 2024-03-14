const express = require("express");
const router = express.Router();
const lodash = require("lodash");
const response = require("../res/res");
const { API } = require("../conn/axios/axios");
const { apiAsana, authAsana } = require("../conn/tabel");
const { dumpError, queryDB, get, set, del } = require("../conn/tabel");


let data;
let results;
let responseCode;
let responseStatus;

const fetchApiJumlahBugs = async () => {
  try {
    const getData = await API("get", apiAsana + `/sections/1202485508633892/tasks`, authAsana);
    const GET_BUGS_WEEK = await queryDB(`SELECT COUNT(no_gid) AS jmltask_week FROM bugs_tim_developer WHERE WEEK(tanggal_task)=WEEK(NOW())`);
    const GET_BUGS_MONTH = await queryDB(`SELECT COUNT(no_gid) AS jmltask_month  FROM bugs_tim_developer WHERE MONTH(tanggal_task)=MONTH(NOW())`);
    return {
      mingguan: GET_BUGS_WEEK.rows[0].jmltask_week,
      bulanan: GET_BUGS_MONTH.rows[0].jmltask_month,
      bugsBelumTerselesaikan: parseFloat(getData.data.data.length),
    };
  } catch (e) {
    dumpError(e);
  }
};

const fetchBugsMonitor = async () => {
  try {
    let endpoint = [`/sections/1202529422051096/tasks`, `/sections/1202485508633890/tasks`, `/sections/1202485508633892/tasks`, `/sections/1202485483189137/tasks`];
    const results = await Promise.all(endpoint.map((url) => API("get", apiAsana + url, authAsana).catch((error) => {
      console.error("Request error", error.response.data)
      return error.response
    })));

    const [
      bugsBelumDiproses,
      bugsDitanganiSistemAnalis,
      bugsDitanganiTimIT,
      bugsDitanganiTechnicalSupport
    ] = results.map((x) => x?.data?.data?.length || 0);

    return {
      bugsBelumDiproses,
      bugsDitanganiSistemAnalis,
      bugsDitanganiTimIT,
      bugsDitanganiTechnicalSupport,
    };
  } catch (error) {
    dumpError(error);
  }
}

const fetchSistemMonitor = async () => {
  try {
    const key = "sistem_monitor";
    const cacheResults = await get(key);
    const GET_BUGS = await queryDB(`SELECT nb.nama_kategori, nb.nama_sistem, kategori FROM notifikasi_bugs_sistem nb 
        JOIN kategori_sistem ks USING(nama_kategori) WHERE nb.status_sistem=0 
        AND ks.status_kategori=0`);
    const data = lodash(GET_BUGS.rows)
      .groupBy("nama_kategori")
      .map((item, name) => {
        return {
          nama_kategori: name,
          item,
        };
      })
      .value();
    const loopNameSistem = data === JSON.parse(cacheResults);
    if (cacheResults) {
      if (loopNameSistem) {
        isCached = true;
        results = JSON.parse(cacheResults);
      } else {
        await del(key);
        await set(key, JSON.stringify(data));
        results = data;
      }
    } else {
      results = data;
      if (results.length === 0) {
        throw "API returned an empty array";
      }
      await set(key, JSON.stringify(results));
    }
    return results;
  } catch (e) {
    dumpError(e);
  }
};

const SocketRouter = (io) => {
  
  (async () => {
    Promise.all([io.emit("bugs_monitor", await fetchBugsMonitor()), io.emit("jumlah_bugs", await fetchApiJumlahBugs())]);
    setInterval(async () => {
      io.emit("sistem_monitor", await fetchSistemMonitor());
    }, 500);
    setInterval(async () => {
      Promise.all([io.emit("bugs_monitor", await fetchBugsMonitor()), io.emit("jumlah_bugs", await fetchApiJumlahBugs())]);
    }, 2000);
  })();


  router.get("/dokumentasi/sistem_monitor_jumlah", async (req, res) => {
    try {
      data = await fetchApiJumlahBugs();
      let responseStatus = "SUKSES";
      let responseCode = 200;
      if (!data) {
        responseStatus = "GAGAL";
        responseCode = 400;
      }
      io.emit("jumlah_bugs", data);
      return response.ok(
        {
          status: responseStatus,
          pesan: data,
        },
        responseCode,
        res
      );
    } catch (e) {
      dumpError(e);
      return response.ok(
        {
          status: "GAGAL",
          pesan: e,
        },
        300,
        res
      );
    }
  });


  router.get("/dokumentasi/bugs_monitoring", async (req, res) => {
    try {
      data = await fetchBugsMonitor();
      if (!data) {
        responseStatus = "GAGAL";
        responseCode = 400;
      }
      io.emit("bugs_monitor", data);
      return response.ok(
        {
          status: responseStatus,
          pesan: data,
        },
        responseCode,
        res
      );
    } catch (e) {
      dumpError(e);
      return response.ok(
        {
          status: "GAGAL",
          pesan: e,
        },
        300,
        res
      );
    }
  });
  return router;
};

module.exports = SocketRouter;
