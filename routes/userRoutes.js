const { CreateAccount, LoginAccount, GetProfile, UpdateProfile, ValidateOtp, ResendOtpVerification, FindAccountByEmail, VerifyOtpForPassword, ChangePasswordOnRequest, ContactFromUsers, DeleteAcount, UserWallet, UserUp } = require('../controllers/userController')
const { UserMiddleware, AllMiddleware } = require('../middleware/auth')




const router = require('express').Router()

router.post('/create-account', CreateAccount)
router.post('/login-account', LoginAccount)
router.get('/profile', AllMiddleware, GetProfile)
router.put('/update-profile', UserMiddleware, UpdateProfile)
router.post('/validate-email', ValidateOtp)
router.post('/resend-otp', ResendOtpVerification)
router.post('/find-email', FindAccountByEmail)
router.post('/verify-email', VerifyOtpForPassword)
router.post('/change-password', ChangePasswordOnRequest)
router.post('/contact', ContactFromUsers)
router.post('/delete-account', UserMiddleware, DeleteAcount)
router.get('/user-wallet', UserMiddleware, UserWallet)
router.get('/user-ups', UserMiddleware, UserUp)


module.exports = router