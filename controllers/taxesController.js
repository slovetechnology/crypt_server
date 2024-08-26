const sendMail = require('../config/emailConfig')
const Tax = require('../models').taxes
const User = require('../models').users
const Notification = require('../models').notifications


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

        await Tax.create({
            user: req.user,
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

        const admins = await User.findAll({ where: { role: 'admin' } })
        if (admins) {
            admins.map(async ele => {
                await Notification.create({
                    user: ele.id,
                    title: `tax payment alert`,
                    content: `Hello Admin, ${taxPayer} just made a tax payment amount of $${amount} to ${crypto} deposit address.`,
                    URL: '/admin-controls/taxes',
                })

                const content = `<div font-size: 1rem;>Admin, ${taxPayer} just made a tax payment amount of $${amount} to ${crypto} deposit address.</div> `

                await sendMail({ subject: 'User Tax Payment', to: ele.email, html: content, text: content })
            })
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