const { ClaimInvestment, UserInvestments, UserUnclaimInvestments } = require('../controllers/investmentController')
const { UserMiddleware, AllMiddleware } = require('../middleware/auth')




const router = require('express').Router()

router.get('/user-investment', UserMiddleware, UserInvestments)
router.get('/user-unclaim-investment', UserMiddleware, UserUnclaimInvestments )
router.post('/claim-investment', UserMiddleware, ClaimInvestment)


module.exports = router