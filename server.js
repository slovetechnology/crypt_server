
const express = require('express')
const http = require('http')
const fileUpload = require('express-fileupload')
const cors = require('cors')

const app = express()

const port = 5005 || process.env.PORT

// const server = http.createServer(app)
require('dotenv').config()

const CORSSERVERS = ["https://admin.socket.io", "http://localhost:5173", "https://cryptovilles.com", "https://www.cryptovilles.com"]
app.use(cors({
    origin: CORSSERVERS
}))
app.use(express.json())

app.use(fileUpload())

app.use(express.static('public'))


app.use('/api/user', require('./routes/userRoutes'))
app.use('/api/deposit', require('./routes/depositRoute'))
app.use('/api/admin', require('./routes/adminRoute'))
app.use('/api/notification', require('./routes/notificationRoute'))
app.use('/api/withdraw', require('./routes/withdrawalRoute'))
app.use('/api/investment', require('./routes/investmentRoute'))
app.use('/api/tax', require('./routes/taxRoute'))
app.use('/api/kyc', require('./routes/kycRoute'))

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
