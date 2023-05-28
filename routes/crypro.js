
const CryptoJS = require("crypto-js");
const secretKey = 'clent-info-central-2023-secret-key-siva'; 



const encrypt = (dataStr)=>{
    return CryptoJS.AES.encrypt(dataStr, secretKey).toString();

}

const decrypt = (ciphertext)=>{
    return CryptoJS.AES.decrypt(ciphertext, secretKey).toString(CryptoJS.enc.Utf8)
}

module.exports = {
    encrypt,
    decrypt
}