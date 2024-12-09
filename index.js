const { fetchElfsquadDataFromFile } = require('./elfsquad.js')
const { google } = require('googleapis')
const sheets = google.sheets('v4')
require('dotenv').config()

const range = 'Teamleader!K:K'

async function authenticateSpreadsheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './valiant-vault-434809-u7-5abceba5cab8.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const authClient = await auth.getClient()
    google.options({ auth: authClient })
}

async function getSheet() {
    try {
		await authenticateSpreadsheets()
        const esData = fetchElfsquadDataFromFile()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range
        })
        const values = response.data.values.flat()

        let matchcount = 0
        for (i = 0; i < values.length; i++) {
            for (j = 0; j < esData.length; j++) {
                if (values[i] === esData[j].articleCode) {
                    matchcount += 1

                    // Update spreadsheet
                    const updateRange = `Teamleader!T${i+1}`
                    await sheets.spreadsheets.values.update({
                        spreadsheetId: process.env.SPREADSHEET_ID,
                        range: updateRange,
                        valueInputOption: 'USER_ENTERED',
                        requestBody: { values: [[esData[j].id]] }
                    })
                }
            }
        }
        console.log(`Found ${matchcount} matches`)
    } catch(e) {
        console.error('Error: ', e)
    }
}

getSheet()
