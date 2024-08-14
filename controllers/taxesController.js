const sendMail = require('../config/emailConfig')
const Tax = require('../models').taxes
const User = require('../models').users
const Notification = require('../models').notifications
const fs = require('fs')
const slug = require('slug')


exports.UserTaxes = async (req, res) => {
    try {
        const taxes = await Tax.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: taxes })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.PayTax = async (req, res) => {
    try {

        const { amount, crypto, deposit_address, taxPayer } = req.body
        if (!amount || !crypto || !deposit_address || !taxPayer) return res.json({ status: 404, msg: `Incomplete request found` })
        if (!req.files) return res.json({ status: 404, msg: `Attach proof of payment` })
        const image = req.files.payment_proof

        const filePath = './public/taxPayment'
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath)
        }

        const imageName = `${slug(taxPayer, '-')}.jpg`

        await image.mv(`${filePath}/${imageName}`)

        await Tax.create({
            user: req.user,
            payment_proof: imageName,
            amount,
            crypto,
            deposit_address
        })

        await Notification.create({
            user: req.user,
            title: `tax payment success`,
            content: `Your tax payment amount of $${amount} was successful, pending confirmation.`,
            URL: '/dashboard/tax-payment',
        })

        const admin = await User.findOne({ where: { role: 'admin' } })
        if (admin) {
            await Notification.create({
                user: admin.id,
                title: `tax payment alert`,
                content: `Hello Admin, ${taxPayer} ust made a tax payment amount of $${amount} to ${crypto} deposit address.`,
                role: 'admin',
                URL: '/admin-controls/taxes',
            })

            const content = `<div font-size: 1rem;>Admin, ${taxPayer} just made a tax payment amount of $${amount} to ${crypto} deposit address.</div> `

            await sendMail({ from: 'support@secureinvest.org', subject: 'User Tax Payment', to: admin.email, html: content, text: content })
        }

        const notifications = await Notification.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        const unreadnotis = await Notification.findAll({
            where: { user: req.user, read: 'false' },
        })

        return res.json({ status: 200, msg: 'Tax payment success', notis: notifications, unread: unreadnotis })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}