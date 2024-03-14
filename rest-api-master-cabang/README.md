# Rest Api Master Cabang (KONSTANTA)

Repository ini digunakan untuk base dasar untuk pembuatan aplikasi backend, dan akan selalu di update sesuai kebutuhan yang ada di knitto.

kunjungi branch **[example/simple-case](https://github.com/knittotextile/rest-boilerplate-ts/tree/example/simple-case)** untuk mencoba koneksi database Mysql dan queue message Rabbitmq, kemudian download **[Postman Collection](https://drive.google.com/file/d/1QAPqquKXpqfqqg0QWBJrmaP3a3C3Qm19/view?usp=drive_link)** berikut untuk melakukan percobaan.

## Struktur Project 

**`Keterangan`**
- Pengguna nama file atau folder ketika ada spasi menggunakan `-`.
- Masukan kedalam folder bila terdapat pengujian atau file lain yang berinterkasi seperti pada contoh folder controller dan middleware di bawah.
----------

```bash
/ root directory
├── database                    # digunakan untuk migration database
│   ├── knexfile.ts             # Koneksi database untuk melakukan migration
│   └── migrations              # berisi kumpulan migration data
├── src                         # source prorgam
│   ├── app                     # folder jenis aplikasi yang dibuat
│   │   │
│   │   ├── http                # aplikasi http / rest / api
│   │   │   ├── controller
│   │   │   │   ├── nama.controller
│   │   │   │   │   ├── [nama-controller].dto.ts
│   │   │   │   │   ├── [nama-controller].controller.ts
│   │   │   │   │   └── [nama-controller].spec.ts
│   │   │   │   └── ...n.controller
│   │   │   ├── middleware
│   │   │   │   │   ├── [nama-middleware].middleware.ts
│   │   │   │   │   └── [nama-middleware].spec.ts
│   │   │   │   └── ...n.middleware
│   │   │   ├── routes
│   │   │   │    ├── [nama-router].routes.ts
│   │   │   │    └── [...n-router].routes.ts
│   │   │   └── index.ts        # konfigurasi awal http / rest / api
│   │   ├── listener
│   │   │   ├── listen          # kumpulan sucbscriber
│   │   │   ├── send            # kumpulan send event yang di kirim
│   │   │   └── index.ts        # konfigurasi awal listener / queue
│   │   ├── timer
│   │   │   └── index.ts        # konfigurasi awal timer / task scheduler
│   │   └── ws
│   │       └── index.ts        # konfigurasi websocket
│   ├── config                  # konfigurasi koneksi / environment aplikasi
│   ├── entity                  # kumpulan entity
│   ├── libs                    # berisikan aplikasi atau interaksi pihak ke 3
│   ├── repositories            # kumpulan repositori
│   ├── services                # kumpulan share kode aplikasi yang reusable
│   ├── types                   # kumpulan file types d.ts
│   └── index.ts                # pemanggilan awal aplikasi
├── storage                     # penyimpanan logs dan files
└── tests                       # folder untuk testing global
```

## Core Knitto Package
repository ini menggunakan library khusus [**`Knitto Core Backend`**](https://github.com/knittotextile/knitto-core-backend) secara private, gunakan panduan berikut untuk cara install library core [**`Working with the npm registry`**](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).
