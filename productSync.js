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
    } catch (e) {
        if (e.code && e.code.startsWith('5')) {
            console.error("Server error, please try again later: ", e)
        } else if (e.code && e.code.startsWith('4')) {
            console.error("Client error, something went wrong: ", e)
        } else {
            console.error("Error encountered in getSpreadsheetValues: ", e)
        }
    }
}

function filterInvalidRows(values) {
    const columnCount = values[0].length
    const filledRows = values.filter(row => row.length === columnCount)
    const validRows = filledRows.filter(row => isValidUUID(row[columnCount - 1]))

    return validRows
}


function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isValid = uuidRegex.test(uuid)

    if (!isValid) {
        console.log(`Invalid UUID found: ${uuid}`)
    } else {
        return isValid
    }
}

function searchForDuplicates(values) {
    let checked = []
    const columnCount = values[0].length

    for (i = 0; i < values.length; i++) {
        const row = values[i]
        if (checked.includes(row[columnCount - 1])) {
            console.log(`Duplicate found, please resolve and rerun the program: ${row[columnCount - 1]}`)
            return true
        }
        checked.push(row[columnCount - 1])
    }
}

async function main() {
    try {
        // Authentication
        await authenticateSpreadsheets()

        // Get spreadsheet values and filter them
        const values = await getSpreadsheetValues()
        const validValues = filterInvalidRows(values)

        // Check for duplicate Elfsquad ID's 
        const duplicateFound = searchForDuplicates(validValues)
        if (duplicateFound) {
            return
        } else {
            console.log("No duplicates found!")
        }

    } catch (e) {
        console.error(e)
    }
}

main().catch(error => console.error(error))
