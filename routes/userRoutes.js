const { CreateAccount, LoginAccount, GetProfile, UpdateProfile, ValidateOtp, ResendOtpVerification, FindAccountByEmail, VerifyOtpForPassword, ChangePasswordOnRequest, ContactFromUsers, DeleteAcount, UserWallet, UserUp, Get_Admin_Cryptocurrency_And_Their_Wallets, GetTestRunPlan } = require('../controllers/userController')
const { UserMiddleware, AllMiddleware } = require('../middleware/auth')




const router = require('express').Router()

router.post('/create-account', CreateAccount)
router.post('/login-account', LoginAccount)
router.get('/profile', AllMiddleware, GetProfile)
router.put('/update-profile', AllMiddleware, UpdateProfile)
router.post('/validate-email', ValidateOtp)
router.post('/resend-otp', ResendOtpVerification)
router.post('/find-email', FindAccountByEmail)
router.post('/verify-email', VerifyOtpForPassword)
router.post('/change-password', ChangePasswordOnRequest)
router.post('/contact', ContactFromUsers)
router.put('/delete-account', UserMiddleware, DeleteAcount)
router.get('/user-wallet', UserMiddleware, UserWallet)
router.get('/user-ups', UserMiddleware, UserUp)
router.get('/get_crypto_and_thier_wallets', UserMiddleware, Get_Admin_Cryptocurrency_And_Their_Wallets)
router.get('/get_test_run_plan', UserMiddleware, GetTestRunPlan)


module.exports = router