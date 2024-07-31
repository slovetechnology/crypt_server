const { AllDeposits, UpdateDeposits, AllUsers, DeleteUser, GetUserTotalInvestment, AllWithdrawals, UpdateWithdrawals, CreateAdminWallets, UpdateAdminWallet, DeleteWallet, GetAdminWallets } = require('../controllers/adminControllers')
const { AdminMiddleware, AllMiddleware } = require('../middleware/auth')


const router = require('express').Router()

router.get('/all-users', AdminMiddleware, AllUsers)
router.get('/all-deposits', AdminMiddleware, AllDeposits)
router.get('/all-withdrawals', AdminMiddleware, AllWithdrawals)
router.put('/update-deposits', AdminMiddleware, UpdateDeposits)
router.put('/update-withdrawals', AdminMiddleware, UpdateWithdrawals)
router.post('/delete-users', AdminMiddleware, DeleteUser)
router.post('/get-user-total', AdminMiddleware, GetUserTotalInvestment)
router.post('/create-admin-wallet', AdminMiddleware, CreateAdminWallets)
router.get('/all-admin-wallets', AllMiddleware, GetAdminWallets)
router.put('/update-admin-wallet', AdminMiddleware, UpdateAdminWallet)
router.post('/delete-admin-wallet', AdminMiddleware, DeleteWallet)



module.exports = router