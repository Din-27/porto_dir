const TAFFY = require("taffydb").taffy

var checkUser = TAFFY(
    [
        {
            "cabang": "holis",
            "status": 0,
            "user": ""
        },
        {
            "cabang": "kebon_jukut",
            "status": 0,
            "user": ""
        },
        {
            "cabang": "jogja",
            "status": 0,
            "user": ""
        },
        {
            "cabang": "semarang",
            "status": 0,
            "user": ""
        },
        {
            "cabang": "surbaya",
            "status": 0,
            "user": ""
        },
    ]
);

module.exports = checkUser