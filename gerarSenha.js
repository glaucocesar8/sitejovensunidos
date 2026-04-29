const bcrypt = require('bcrypt');

async function gerar() {
  const hash = await bcrypt.hash('Gl@uco8713', 10);
  console.log(hash);
}

gerar();