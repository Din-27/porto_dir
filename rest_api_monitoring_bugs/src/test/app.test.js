const chai = require('chai')
const { it } = require('mocha')
const chaiHttp = require('chai-http')
const { queryDB } = require("../conn/tabel");
const app = '192.168.20.15:8000/dokumentasi'
const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.\
eyJpZCI6MiwiaWF0IjoxNjU5NTg2MjMxfQ.u2Wms1cWpaqkGPP2TKmrc8Uum3n7l3scaXbQQChTjMQ'

const { expect } = chai
chai.use(chaiHttp)
describe("Server!", () => {
    it("test login route", done => {
        chai
            .request(app)
            .post("/login")
            .send({
                username: "herdin",
                password: "dmain"
            })
            .end((err, res) => {
                if (err) throw err
                expect(res).to.have.status(200);
                expect(res.body.status).to.equals(200);
                expect(res.body.values.status).to.equals("SUKSES");
                expect(res.body.values.username).to.equals("herdin");
                expect(res.body.values.secretkey).to.equals(res.body.values.secretkey);
                done()
            })
    })
    it("test get_project route", done => {
        chai
            .request(app)
            .get("/get_project")
            .set({ Authorization: token })
            .end((err, res) => {
                if (err) throw err
                expect(res).to.have.status(200);
                expect(res.body.pesan).to.equals("SUKSES");
                expect(res.body.values.data[0].gid).to.equals("1201635295654519");
                expect(res.body.values.data[0].resource_type).to.equals("project");
                expect(res.body.values.data[0].name).to.equals("Material Handling")
                done()
            })
    })
    it("test getDoubleParams", done => {
        chai
            .request(app)
            .get(`/sections/${1202485483189137}/tasks`)
            .end((err, res) => {
                if (err) throw err
                expect(res).to.have.status(200);
                expect(res.body.pesan).to.equals("SUKSES");
                expect(res.body.values.data[0].name).to.equals("c")
                expect(res.body.values.data[0].resource_type).to.equals("task");
                expect(res.body.values.data[0].gid).to.equals("1202544698997568");
                expect(res.body.values.data[0].resource_subtype).to.equals("default_task");
                done()
            })
    })
    it("test get_kategori", done => {
        chai
            .request(app)
            .get('/get_kategori')
            .end((err, res) => {
                if (err) throw err
                expect(res).to.have.status(200);
                expect(res.body.values.pesan[0].id).to.equals(18);
                expect(res.body.values.status).to.equals("SUKSES");
                expect(res.body.values.pesan[0].jumlah_sistem).to.equals(8)
                expect(res.body.values.pesan[0].nama_kategori).to.equals("Google Cloud");
                done()
            })
    })
    it("test add_kategori", done => {
        chai
            .request(app)
            .post("/add_kategori")
            .set({ Authorization: token })
            .send({
                nama_kategori: "Sistem Test"
            })
            .end((err, res) => {
                if (err) throw err
                expect(res).to.have.status(200);
                expect(res.body.values.status).to.equals("SUKSES");
                expect(res.body.values.pesan).to.equals("kategori berhasil disimpan")
                done()
            })
    })
    it("test update_kategori", done => {
        queryDB(`select id from kategori_sistem where nama_kategori="Sistem test"`)
            .then(result => {
                chai
                    .request(app)
                    .patch("/update_kategori")
                    .set({ Authorization: token })
                    .send({
                        "id_kategori": result.rows[0].id,
                        "nama_kategori": "test add group",
                        "nama_kategoriUpdated": "Sistem test"
                    })
                    .end((err, res) => {
                        if (err) throw err
                        expect(res).to.have.status(200);
                        expect(res.body.values.status).to.equals("SUKSES");
                        expect(res.body.values.pesan).to.equals("nama kategori berhasil di ubah")
                        done()
                    })
            })
            .catch(err => console.log(err))
    })
    it("test delete_kategori", done => {
        queryDB(`select id from kategori_sistem where nama_kategori="Sistem test"`)
            .then(result => {
                chai
                    .request(app)
                    .delete("/delete_kategori")
                    .set({ Authorization: token })
                    .send({
                        "id_kategori": result.rows[0].id
                    })
                    .end((err, res) => {
                        if (err) throw err
                        expect(res).to.have.status(200);
                        expect(res.body.values.status).to.equals("SUKSES");
                        expect(res.body.values.pesan).to.equals("kategori berhasil di hapus")
                        done()
                    })
            })
            .catch(err => console.log(err))
    })
})