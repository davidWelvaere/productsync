const axios = require('axios')
const qs = require('qs')
const fs = require('fs')
require('dotenv').config()

async function authenticateElfsquad() {
    const baseURL = 'https://login.elfsquad.io/oauth2/token'
    const payload = {
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'scope': process.env.SCOPE,
        'grant_type': process.env.GRANT_TYPE
    }
    const options = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }
    try {
        const response = await axios.post(baseURL, qs.stringify(payload), options)
        console.log(response.data.access_token)
        return response.data.access_token
    } catch(e) {
        console.error('Error: ', e)
    }
}

async function fetchElfsquadData(token) {
    let skip = 0
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    }

    let totalData = []

    while (skip < 1000) {
        try {
            console.log(`Skip is at: ${skip}`)
            const baseURL = `https://api.elfsquad.io/data/1/Features?$top=100&$skip=${skip}`
            const response = await axios.get(baseURL, { headers })
            totalData = [...totalData, ...response.data.value]
            console.log(`totalData length is: ${totalData.length}`)
            skip += 100
        } catch(e) {
            console.error('Error: ', e)
        }
    }

	return totalData
}

function fetchElfsquadDataFromFile() {
    data = fs.readFileSync('./esdata.json', 'utf8')

    return JSON.parse(data)
}

module.exports = {
    fetchElfsquadDataFromFile,
	authenticateElfsquad,
	fetchElfsquadData
}



// fetchElfsquadData()
