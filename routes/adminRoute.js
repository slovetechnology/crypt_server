const { AllUsers, AllWithdrawals, UpdateWithdrawals, CreateAdminWallets, UpdateAdminWallet, DeleteWallet, GetAdminWallets, GetUserFigures, AllInvestments, UpdateInvestments, CreateTradingPlan, GetTradingPlans, UpdateTradingPlan, DeleteTradingPlan, AllDeposits, UpdateDeposits, GetAdminStore, UpdateAdminStore, AllTaxes, UpdateTaxes, AdminCreateAccount, UpdateUsers, UpdateKYC } = require('../controllers/adminControllers')
const { AdminMiddleware, AllMiddleware } = require('../middleware/auth')


const router = require('express').Router()

router.get('/all-users', AdminMiddleware, AllUsers)
router.get('/all-deposits', AdminMiddleware, AllDeposits)
router.get('/all-investments', AdminMiddleware, AllInvestments)
router.get('/all-withdrawals', AdminMiddleware, AllWithdrawals)
router.put('/update-deposits', AdminMiddleware, UpdateDeposits)
router.put('/update-investments', AdminMiddleware, UpdateInvestments)
router.put('/update-withdrawals', AdminMiddleware, UpdateWithdrawals)
router.put('/update-users', AdminMiddleware, UpdateUsers)
router.post('/get-user-total', AdminMiddleware, GetUserFigures)
router.post('/create-admin-wallet', AdminMiddleware, CreateAdminWallets)
router.get('/all-admin-wallets', AllMiddleware, GetAdminWallets)
router.put('/update-admin-wallet', AdminMiddleware, UpdateAdminWallet)
router.post('/delete-admin-wallet', AdminMiddleware, DeleteWallet)
router.post('/create-trading-plan', AdminMiddleware, CreateTradingPlan)
router.get('/all-trading-plans', GetTradingPlans)
router.put('/update-trading-plan', AdminMiddleware, UpdateTradingPlan)
router.post('/delete-trading-plan', AdminMiddleware, DeleteTradingPlan)
router.get('/admin-store', GetAdminStore)
router.put('/update-admin-store', AdminMiddleware, UpdateAdminStore)
router.get('/all-taxes', AdminMiddleware, AllTaxes)
router.put('/update-taxes', AdminMiddleware, UpdateTaxes)
router.post('/admin-create-account', AdminMiddleware, AdminCreateAccount)
router.put('/update-kyc', AdminMiddleware, UpdateKYC)


module.exports = router