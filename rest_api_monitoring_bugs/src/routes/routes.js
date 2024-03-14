const requestIp = require('request-ip');
const { auth } = require("../auth/auth");
const login = require("../dokumentasi/auth_user");
const get_project = require("../dokumentasi/get_project");
const group_sistem = require("../dokumentasi/group_sistem");
const detail_sistem = require("../dokumentasi/detail_sistem");
const doublechecker = require("../dokumentasi/testdoubelchecker");


module.exports = function (app) {
  app.use(requestIp.mw())

  //login
  app.post("/dokumentasi/login", login.login_user);

  //get_project
  app.get("/dokumentasi/get_project", auth, get_project.getProject);
  app.get("/dokumentasi/sections/:params/tasks", get_project.getDoubleParams);

  //handle kategori
  app.get("/dokumentasi/get_kategori", group_sistem.get_group_sistem);
  app.post("/dokumentasi/add_kategori", auth, group_sistem.add_group_sistem);
  app.patch("/dokumentasi/update_kategori", auth, group_sistem.update_group_sistem);
  app.delete("/dokumentasi/delete_kategori", auth, group_sistem.delete_group_sistem);

  //handle sistem
  app.post("/dokumentasi/get_sistem", detail_sistem.getData_sistem_monitor);
  app.post("/dokumentasi/add_sistem", auth, detail_sistem.add_sistem_monitor);
  app.patch("/dokumentasi/edit_sistem", auth, detail_sistem.update_sistem_monitor);
  app.patch("/dokumentasi/solved_sistem", auth, detail_sistem.update_sistem_kategori);
  app.delete("/dokumentasi/delete_sistem", auth, detail_sistem.delete_sistem_monitor);
  

  // testing double checked
  app.post("/dokumentasi/testing", doublechecker.doublechecker);

  app.get("/dokumentasi/gettesting", doublechecker.getredis);
};
