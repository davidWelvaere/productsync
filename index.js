const axios = require('axios')
require('dotenv').config()

const RANGE = 'Artikelen die niet in TL staan maar wel in Exact!A1:C10'

async function getSheet() {
    try {
        const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${process.env.SPREADSHEET_ID}/values/${RANGE}?key=${process.env.API_KEY}`)
        console.log(Object.keys(response))
    } catch(e) {
        console.error('Error: ', e)
    }


}

getSheet()
