// save_image_to_json.js
const fs = require('fs');

// baca file gambar (binary)
const imagePath = 'foto.jpg';
const imageBuffer = fs.readFileSync(imagePath);

// ubah jadi base64
const base64Data = imageBuffer.toString('base64');

// buat JSON
const jsonData = {
  filename: imagePath,
  mimetype: 'image/png',
  data: base64Data,
};

// simpan ke file json
fs.writeFileSync('image.json', JSON.stringify(jsonData, null, 2));

console.log('✅ Gambar berhasil disimpan ke image.json');
