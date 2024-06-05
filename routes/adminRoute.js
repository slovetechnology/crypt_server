const { AllDeposits, UpdateDeposits, AllUsers, DeleteUser, GetUserTotalInvestment, AllWithdrawals, UpdateWithdrawals } = require('../controllers/adminControllers')
const { AdminMiddleware } = require('../middleware/auth')


const router = require('express').Router()

router.get('/all-users', AdminMiddleware, AllUsers)
router.get('/all-deposits', AdminMiddleware, AllDeposits)
router.get('/all-withdrawals', AdminMiddleware, AllWithdrawals)
router.put('/update-deposits', AdminMiddleware, UpdateDeposits)
router.put('/update-withdrawals', AdminMiddleware, UpdateWithdrawals)
router.post('/delete-users', AdminMiddleware, DeleteUser)
router.post('/get-user-total', AdminMiddleware, GetUserTotalInvestment)



module.exports = router