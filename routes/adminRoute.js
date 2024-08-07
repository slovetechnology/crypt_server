const { AllUsers, DeleteUser, AllWithdrawals, UpdateWithdrawals, CreateAdminWallets, UpdateAdminWallet, DeleteWallet, GetAdminWallets, GetUserFigures, AllInvestments, UpdateInvestments, CreateTradingPlan, GetTradingPlans, UpdateTradingPlan, DeleteTradingPlan, AllDeposits, UpdateDeposits } = require('../controllers/adminControllers')
const { AdminMiddleware, AllMiddleware } = require('../middleware/auth')


const router = require('express').Router()

router.get('/all-users', AdminMiddleware, AllUsers)
router.get('/all-deposits', AdminMiddleware, AllDeposits)
router.get('/all-investments', AdminMiddleware, AllInvestments)
router.get('/all-withdrawals', AdminMiddleware, AllWithdrawals)
router.put('/update-deposits', AdminMiddleware, UpdateDeposits)
router.put('/update-investments', AdminMiddleware, UpdateInvestments)
router.put('/update-withdrawals', AdminMiddleware, UpdateWithdrawals)
router.post('/delete-users', AdminMiddleware, DeleteUser)
router.post('/get-user-total', AdminMiddleware, GetUserFigures)
router.post('/create-admin-wallet', AdminMiddleware, CreateAdminWallets)
router.get('/all-admin-wallets', AllMiddleware, GetAdminWallets)
router.put('/update-admin-wallet', AdminMiddleware, UpdateAdminWallet)
router.post('/delete-admin-wallet', AdminMiddleware, DeleteWallet)
router.post('/create-trading-plan', AdminMiddleware, CreateTradingPlan)
router.get('/all-trading-plans', AllMiddleware, GetTradingPlans)
router.put('/update-trading-plan', AdminMiddleware, UpdateTradingPlan)
router.post('/delete-trading-plan', AdminMiddleware, DeleteTradingPlan)


module.exports = router