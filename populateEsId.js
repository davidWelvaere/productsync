const { fetchElfsquadDataFromFile } = require('./elfsquad.js')
const { promisify } = require('util')
const { google } = require('googleapis')
const sheets = google.sheets('v4')
require('dotenv').config()

const timeOut = promisify(setTimeout)

async function authenticateSpreadsheets() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './valiant-vault-434809-u7-5abceba5cab8.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const authClient = await auth.getClient()
    google.options({ auth: authClient })
}

async function populate() {
    try {
        await authenticateSpreadsheets()
        const range = 'Productdatabase: TL en Exact kolommen'
        const esData = fetchElfsquadDataFromFile()
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            range
        })
        const values = response.data.values

        let matchCount = 0
        const headerCount = values[0].length
        const nameColumnIndex = 10
        const skuColumnIndex = 8

        for (i = 0; i < values.length; i++) {
            if (values[i][headerCount - 1] === undefined) {
                // console.log("Found empty elfsquadId cell!")
                // console.log(`${ values[i] }`)
                // console.log(values[i][nameColumnIndex])
                for (j = 0; j < esData.length; j++) {
                    if (esData[j].name !== null) {
                        if (values[i][nameColumnIndex].toLowerCase() === esData[j].name.toLowerCase()) {
                            matchCount += 1
                            if (matchCount % 5 === 0) {
                                await timeOut(5000)
                            }


                            // Update spreadsheet
                            console.log('Updating: ', esData[j].name)
                            const updateRange = `Productdatabase: TL en Exact kolommen!AC${i + 1}`
                            await sheets.spreadsheets.values.update({
                                spreadsheetId: process.env.SPREADSHEET_ID,
                                range: updateRange,
                                valueInputOption: 'USER_ENTERED',
                                requestBody: { values: [[esData[j].id]] }
                            })
                        }
                    }
                }
            } else {
                // console.log("Filled cell: ")
                // console.log(`${values[i][headerCount - 1]}}`)
            }
        }
        console.log(`Found ${matchCount} matches`)
    } catch (e) {
        console.error('Error: ', e)
    }
}

populate().then()
