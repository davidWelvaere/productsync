const { fetchElfsquadDataFromFile } = require('./elfsquad.js')
const { google } = require('googleapis')
const sheets = google.sheets('v4')
require('dotenv').config()

async function authenticateSpreadsheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './valiant-vault-434809-u7-5abceba5cab8.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const authClient = await auth.getClient()
    google.options({ auth: authClient })
}

async function getSpreadsheetValues() {
    try {
        const spreadsheetId = process.env.SPREADSHEET_ID
        const range = 'Productdatabase: TL en Exact kolommen'
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        })

        const values = response.data.values

        return values
    } catch(e) {
        if (e.code && e.code.startsWith('5')) {
            console.error("Server error, please try again later: ", e)
        } else {
            console.error("Error encountered in getSpreadsheetValues: ", e)
        }
    }
}

authenticateSpreadsheets().then(() => getSpreadsheetValues())

