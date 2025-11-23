const axios = require('axios');
const fs = require('fs');
const crypto = require("crypto");
const FormData = require('form-data');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const { ImageUploadService } = require('node-upload-images')

// Helper functions
function convertCRC16(str) {
    let crc = 0xFFFF;
    const strlen = str.length;

    for (let c = 0; c < strlen; c++) {
        crc ^= str.charCodeAt(c) << 8;

        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }

    let hex = crc & 0xFFFF;
    hex = ("000" + hex.toString(16).toUpperCase()).slice(-4);

    return hex;
}

function generateTransactionId() {
    return crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 10)
}

function generateExpirationTime() {
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);
    return expirationTime.toISOString();
}

async function elxyzFile(buffer) {
    return new Promise(async (resolve, reject) => {
        try {
const service = new ImageUploadService('pixhost.to');
let { directLink } = await service.uploadFromBinary(buffer, 'skyzo.png');
            resolve(directLink);
        } catch (error) {
            console.error('🚫 Upload Failed:', error);
            reject(error);
        }
    });
}

async function generateQRIS(amount) {
    try {
        let qrisData = "code qris lu";

        qrisData = qrisData.slice(0, -4);
        const step1 = qrisData.replace("010211", "010212");
        const step2 = step1.split("5802ID");

        amount = amount.toString();
        let uang = "54" + ("0" + amount.length).slice(-2) + amount;
        uang += "5802ID";

        const result = step2[0] + uang + step2[1] + convertCRC16(step2[0] + uang + step2[1]);

        const buffer = await QRCode.toBuffer(result);

        const uploadedFile = await elxyzFile(buffer);

        return {
            transactionId: generateTransactionId(),
            amount: amount,
            expirationTime: generateExpirationTime(),
            qrImageUrl: uploadedFile
        };
    } catch (error) {
        console.error('Error generating and uploading QR code:', error);
        throw error;
    }
}

async function createQRIS(amount, codeqr) {
    try {
        let qrisData = codeqr;

        qrisData = qrisData.slice(0, -4);
        const step1 = qrisData.replace("010211", "010212");
        const step2 = step1.split("5802ID");

        amount = amount.toString();
        let uang = "54" + ("0" + amount.length).slice(-2) + amount;
        uang += "5802ID";

        const result = step2[0] + uang + step2[1] + convertCRC16(step2[0] + uang + step2[1]);

        const buffer = await QRCode.toBuffer(result);

        const uploadedFile = await elxyzFile(buffer);
        const transactionId = `TRX${generateTransactionId()}`;
        const expirationTime = generateExpirationTime();

        // Return object matching contoh.json structure (inside the 'data' key)
        return {
            qrImageUrl: uploadedFile,
            amount: amount,
            transactionId: transactionId,
            expirationTime: expirationTime
        };
    } catch (error) {
        console.error('Error generating and uploading QR code:', error);
        throw error;
    }
}

async function checkQRISStatus(apikey, username, token) {
    try {
        const apiUrl = `https://malzxyz-apiorkut.vercel.app/orderkuota/mutasiqr?apikey=${apikey}&username=${username}&token=${token}`;
        const response = await axios.get(apiUrl);
        const result = response.data;
        
        if (!result.status || !result.result || result.result.length === 0) {
            return {
                date: new Date().toISOString().replace('T', ' ').slice(0, 19),
                amount: "0",
                type: "CR",
                qris: "static",
                brand_name: "No Transaction",
                issuer_reff: "N/A",
                buyer_reff: "N/A",
                balance: "0"
            };
        }
        
        // Filter transaksi: hanya yang status "IN" dan keterangan mengandung "NOBU"
        const validTransactions = result.result.filter(transaction => 
            transaction.status === "IN" && 
            transaction.keterangan.includes("NOBU")
        );
        
        if (validTransactions.length === 0) {
            return {
                date: new Date().toISOString().replace('T', ' ').slice(0, 19),
                amount: "0",
                type: "CR",
                qris: "static",
                brand_name: "No Transaction",
                issuer_reff: "N/A",
                buyer_reff: "N/A",
                balance: "0"
            };
        }
        
        // Ambil transaksi terbaru (pertama dalam array setelah filter)
        const latestTransaction = validTransactions[0];
        
        return {
            date: latestTransaction.tanggal,
            amount: latestTransaction.kredit.replace(/\./g, ''), // Hapus titik pemisah ribuan
            type: "CR",
            qris: "static",
            brand_name: latestTransaction.brand.name,
            issuer_reff: latestTransaction.keterangan || "N/A",
            buyer_reff: latestTransaction.id.toString(),
            balance: latestTransaction.saldo_akhir.replace(/\./g, '') // Hapus titik pemisah ribuan
        };
    } catch (error) {
        console.error('Error checking QRIS status:', error);
        throw error;
    }
}

// Contoh penggunaan:
// checkQRISStatus('Malzxyz', 'akmalygy', '832209:jyUCpMR241vQI3qtNWYFmzcfblnASak6');

module.exports = {
    convertCRC16,
    generateTransactionId,
    generateExpirationTime,
    elxyzFile,
    generateQRIS,
    createQRIS,
    checkQRISStatus
};
