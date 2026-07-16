// Minimal PHP serialize() ayrıştırıcı — yalnızca WordPress'in Northeme teması postmeta'da
// kullandığı alt küme için: s (string), i (int), b (bool), N (null), a (array/map).
// Üçüncü taraf paket eklemek yerine (tek kullanım yeri burası) küçük bir el yazımı parser yeterli.
//
// ÖNEMLİ: PHP'nin s:N:"..." uzunluğu BAYT sayısıdır, JS string karakter sayısı değil.
// Türkçe karakterler (ı, ş, ğ, ü, ö, ç) UTF-8'de çok baytlı olduğu için ayrıştırma bir
// Buffer üzerinden bayt ofsetleriyle yapılıyor — JS string index'iyle yapılsaydı "Kanal Adı",
// "Rıdvan Akar" gibi her Türkçe değer yanlış kesilirdi.

export function phpUnserialize(input) {
  const buf = Buffer.from(input, 'utf-8');
  let pos = 0;

  function readUntil(byteChar) {
    const idx = buf.indexOf(byteChar, pos);
    const value = buf.toString('utf-8', pos, idx);
    pos = idx + 1;
    return value;
  }

  function parseValue() {
    const type = String.fromCharCode(buf[pos]);

    if (type === 'N') {
      pos += 2; // "N;"
      return null;
    }
    pos += 2; // "T:" -> tip karakteri + ':'
    if (type === 's') {
      const byteLen = Number(readUntil(0x3a)); // ':'
      pos += 1; // açılış tırnağı
      const value = buf.toString('utf-8', pos, pos + byteLen);
      pos += byteLen;
      pos += 2; // kapanış tırnağı + ';'
      return value;
    }
    if (type === 'i') {
      return Number(readUntil(0x3b)); // ';'
    }
    if (type === 'b') {
      return readUntil(0x3b) === '1';
    }
    if (type === 'd') {
      return Number(readUntil(0x3b));
    }
    if (type === 'a') {
      const count = Number(readUntil(0x3a));
      pos += 1; // '{'
      const entries = [];
      for (let i = 0; i < count; i++) {
        const key = parseValue();
        const value = parseValue();
        entries.push([key, value]);
      }
      pos += 1; // '}'
      // WP genelde string-key'li ilişkisel dizi kullanıyor -> obje olarak döndür
      const allNumericSequential = entries.every(([k], i) => k === i);
      if (allNumericSequential) return entries.map(([, v]) => v);
      return Object.fromEntries(entries);
    }
    throw new Error(`Bilinmeyen PHP serialize tipi "${type}" (pos=${pos})`);
  }

  return parseValue();
}
