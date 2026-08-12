const { google } = require('googleapis');

const encodedCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

if (!encodedCredentials) {
  throw new Error(
    'GOOGLE_SERVICE_ACCOUNT_BASE64 não configurado.'
  );
}

if (!spreadsheetId) {
  throw new Error(
    'GOOGLE_SPREADSHEET_ID não configurado.'
  );
}

let credentials;

try {
  const json = Buffer
    .from(encodedCredentials, 'base64')
    .toString('utf-8');

  credentials = JSON.parse(json);

} catch (error) {

  throw new Error(
    'Não foi possível decodificar as credenciais do Google: ' +
    error.message
  );

}

const auth = new google.auth.GoogleAuth({
  credentials,

  scopes: [
    'https://www.googleapis.com/auth/spreadsheets'
  ]

});

const sheets = google.sheets({
  version: 'v4',
  auth
});


// ======================================================
// LER VALORES
// ======================================================

async function getValues(range) {

  const response = await sheets.spreadsheets.values.get({

    spreadsheetId,

    range

  });

  return response.data.values || [];

}


// ======================================================
// ADICIONAR LINHAS
// ======================================================

async function appendRows(range, values) {

  const response =
    await sheets.spreadsheets.values.append({

      spreadsheetId,

      range,

      valueInputOption: 'USER_ENTERED',

      insertDataOption: 'INSERT_ROWS',

      requestBody: {

        values

      }

    });

  return response.data;

}


// ======================================================
// ATUALIZAR LINHA
// ======================================================

async function updateRange(range, values) {

  const response =
    await sheets.spreadsheets.values.update({

      spreadsheetId,

      range,

      valueInputOption: 'USER_ENTERED',

      requestBody: {

        values

      }

    });

  return response.data;

}


// ======================================================
// LIMPAR LINHA
// ======================================================

async function clearRange(range) {

  const response =
    await sheets.spreadsheets.values.clear({

      spreadsheetId,

      range,

      requestBody: {}

    });

  return response.data;

}


module.exports = {

  sheets,

  SPREADSHEET_ID: spreadsheetId,

  getValues,

  appendRows,

  updateRange,

  clearRange

};