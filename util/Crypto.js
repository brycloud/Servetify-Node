import crypto from 'crypto';


function encrypt(message, secretKey) {
    secretKey = Buffer.alloc(32, secretKey);
    const iv = crypto.randomBytes(16); 
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv);
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted; 
}

function decrypt(encryptedMessage, secretKey) {
    secretKey = Buffer.alloc(32, secretKey);
    const iv = Buffer.from(encryptedMessage.slice(0, 32), 'hex'); 
    const encrypted = encryptedMessage.slice(32); 
    const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted; 
}

export default {encrypt, decrypt};