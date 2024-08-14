const { AllUsers, AllWithdrawals, UpdateWithdrawals, CreateAdminWallets, UpdateAdminWallet, DeleteWallet, GetAdminWallets, GetUserFigures, AllInvestments, UpdateInvestments, CreateTradingPlan, GetTradingPlans, UpdateTradingPlan, DeleteTradingPlan, AllDeposits, UpdateDeposits, FundUserAccount, GetAdminStore, UpdateAdminStore, UpdateUserWithdrawalMinimum, Suspend_Unsuspend_User, AllTaxes } = require('../controllers/adminControllers')
const { AdminMiddleware, AllMiddleware } = require('../middleware/auth')


const router = require('express').Router()

router.get('/all-users', AdminMiddleware, AllUsers)
router.get('/all-deposits', AdminMiddleware, AllDeposits)
router.get('/all-investments', AdminMiddleware, AllInvestments)
router.get('/all-withdrawals', AdminMiddleware, AllWithdrawals)
router.put('/update-deposits', AdminMiddleware, UpdateDeposits)
router.put('/update-investments', AdminMiddleware, UpdateInvestments)
router.put('/update-withdrawals', AdminMiddleware, UpdateWithdrawals)
router.post('/suspend-unsuspend-users', AdminMiddleware, Suspend_Unsuspend_User)
router.post('/get-user-total', AdminMiddleware, GetUserFigures)
router.post('/create-admin-wallet', AdminMiddleware, CreateAdminWallets)
router.get('/all-admin-wallets', AllMiddleware, GetAdminWallets)
router.put('/update-admin-wallet', AdminMiddleware, UpdateAdminWallet)
router.post('/delete-admin-wallet', AdminMiddleware, DeleteWallet)
router.post('/create-trading-plan', AdminMiddleware, CreateTradingPlan)
router.get('/all-trading-plans', GetTradingPlans)
router.put('/update-trading-plan', AdminMiddleware, UpdateTradingPlan)
router.post('/delete-trading-plan', AdminMiddleware, DeleteTradingPlan)
router.put('/fund-user-account', AdminMiddleware, FundUserAccount)
router.put('/update-withdrawal-minimum', AdminMiddleware, UpdateUserWithdrawalMinimum)
router.get('/admin-store', AllMiddleware, GetAdminStore)
router.put('/update-admin-store', AdminMiddleware, UpdateAdminStore)
router.get('/all-taxes', AdminMiddleware, AllTaxes)


module.exports = router