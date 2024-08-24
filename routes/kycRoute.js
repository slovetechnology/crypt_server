
const { UserkYC, Create_Update_Kyc } = require('../controllers/kycController')
const { UserMiddleware } = require('../middleware/auth')



const router = require('express').Router()

router.get('/user-kyc', UserMiddleware, UserkYC)
router.post('/create-update-kyc', UserMiddleware, Create_Update_Kyc)



module.exports = router