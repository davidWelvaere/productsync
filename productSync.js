const { authenticateElfsquad, fetchElfsquadData } = require('./elfsquad.js')
const axios = require('axios')
const { google } = require('googleapis')
const sheets = google.sheets('v4')
const { promisify } = require('util')
require('dotenv').config()

const timeout = promisify(setTimeout)

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

    for (let i = 0; i < values.length; i++) {
        const row = values[i]
        if (checked.includes(row[columnCount - 1])) {
            console.log(`Duplicate found, please resolve and rerun the program: ${row[columnCount - 1]}`)
            return true
        }
        checked.push(row[columnCount - 1])
    }
}

async function sync(values, token) {
    const columnCount = values[0].length

    if (!token) {
        console.error("No access token found before synchronizing data!")
        return
    }

    if (values.length === 0) {
        console.log("Nothing to synchronize!")
        return
    }

    for (let i = 0; i < values.length; i++) {
        const elfsquadID = values[i][columnCount - 1]
        const sku = values[i][8]
        const name = values[i][10]
        const updateURL = `https://api.elfsquad.io/data/1/Features(${elfsquadID})`
        await axios.patch(updateURL, {
            articleCode: sku,
            name
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        await timeout(1000)
    }
}

function checkForUniqueness(spreadsheetValues, elfsquadValues) {
    let uniqueValues = [] 

    for (let i = 0; i < spreadsheetValues.length; i++) {
        const spreadsheetId = spreadsheetValues[i][spreadsheetValues[0].length - 1]
        const spreadsheetSKU = spreadsheetValues[i][8]
        const spreadsheetName = spreadsheetValues[i][10]
        for (let j = 0; j < elfsquadValues.length; j++) {
            const elfsquadId = elfsquadValues[j]['id']
            const elfsquadSKU = elfsquadValues[j]['articleCode']
            const elfsquadName = elfsquadValues[j]['name']

            if (!(spreadsheetId === elfsquadId)) {
                continue
            }

            if (spreadsheetSKU !== elfsquadSKU || spreadsheetName !== elfsquadName) {
                console.log(`Unique value found: ${spreadsheetValues[i][spreadsheetValues[i].length - 1]}`)
                console.log(`Unique because: SKU, Name ----- ${spreadsheetSKU !== elfsquadSKU}, ${spreadsheetName !== elfsquadName}`)
                uniqueValues.push(spreadsheetValues[i])
            }
        }
    }

    console.log(uniqueValues.length)

    return uniqueValues
}

async function main() {
    try {
        // Authentication
        await authenticateSpreadsheets()
        const token = await authenticateElfsquad()

        // Get spreadsheet values and filter them
        const values = await getSpreadsheetValues()
        const validValues = filterInvalidRows(values)

        // Check for duplicate Elfsquad ID's spreadsheet values
        const duplicateFound = searchForDuplicates(validValues)
        if (duplicateFound) {
            return
        } else {
            console.log("No duplicates found!")
        }

        // Get Elfsquad data and check if there are any values to sync
        const elfsquadData = await fetchElfsquadData(token)
        const uniqueValues = checkForUniqueness(validValues, elfsquadData)

        // Sync data to Elfsquad
        // await sync(uniqueValues, token)
        
    } catch (e) {
        console.error(e)
    }
}

main().catch(error => console.error(error))

