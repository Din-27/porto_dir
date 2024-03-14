exports.ResponseDataPenjualanSchema = {
    type: "object",
    properties: {
        value: { type: "object", nullable: false },
        jumlah_user_baru: { type: "number", nullable: false },
        tanggal_awal: { type: "string", nullable: false },
        tanggal_akhir: { type: "string", nullable: false },
    },
    required: [
        "value",
        "jumlah_user_baru",
        "tanggal_awal",
        "tanggal_akhir"
    ]
}
