
const { GetUserNotifications, DeleteNotification, UpdateAllNotifications, UpdateSingleNotifications, UnreadNotifications } = require('../controllers/notificationController')
const { AllMiddleware } = require('../middleware/auth')



const router = require('express').Router()

router.get('/user-notifications', AllMiddleware, GetUserNotifications)
router.post('/delete-notification', AllMiddleware, DeleteNotification)
router.put('/update-all', AllMiddleware, UpdateAllNotifications)
router.put('/update-single', AllMiddleware, UpdateSingleNotifications)
router.get('/unread-notis', AllMiddleware, UnreadNotifications)





module.exports = router