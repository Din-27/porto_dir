const response = require("../res/res");
const { API } = require("../conn/axios/axios");
const { dumpError } = require("../conn/tabel");
const { apiAsana, authAsana, get, set } = require("../conn/tabel");


exports.getProject = async (req, res) => {
  try {
    const getData = await API("get", apiAsana + "/projects", authAsana);
    results = getData.data;
    return res.status(200).send({
      pesan: "SUKSES",
      values: results,
    });
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
};

// 1202529422051096
exports.getDoubleParams = async (req, res) => {
  const { params } = req.params;
  try {
    const getData = await API("get", apiAsana + `/sections/${params}/tasks`, authAsana);
    return res.status(200).send({
      pesan: "SUKSES",
      values: getData.data,
    });
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
};
