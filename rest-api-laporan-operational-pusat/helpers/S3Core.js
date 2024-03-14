/* eslint-disable no-undef */
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')

const s3 = new S3Client({
    region: "us-east-1",
    endpoint: process.env.S3_HOST,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
    forcePathStyle: true,
})

const bucketName = "laporan-marketing"
const key = "LAPORAN_PENJUALAN_MARKETING.xlsx"

const fileContent = fs.readFileSync(`/home/webserviceslave-knittopusat/it-dev/rest-api-laporan-marketing-pusat/excel/LAPORAN_PENJUALAN_MARKETING.xlsx`);
// Persiapkan perintah untuk mengunggah file
const uploadCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
});

// Create a command to get the object
const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
});

exports.UploadS3 = () => s3.send(uploadCommand)
    .then((data) => {
        console.log("List of objects:", data);
    })
    .catch((error) => {
        console.error("Error listing objects:", error);
    });


exports.DownloadS3 = () => s3.send(getObjectCommand)
    .then((data) => {
        console.log("List of objects:", data.Contents);
        return data
    })
    .catch((error) => {
        console.error("Error listing objects:", error);
    });