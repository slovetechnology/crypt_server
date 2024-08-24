const sendMail = require('../config/emailConfig')
const Deposit = require('../models').deposits
const Notification = require('../models').notifications
const User = require('../models').users

exports.CreateDeposit = async (req, res) => {
    try {

        const { amount, crypto, deposit_address, depositUser } = req.body
        if (!amount || !crypto || !deposit_address || !depositUser) return res.json({ status: 404, msg: `Incomplete request found` })

        await Deposit.create({
            user: req.user,
            amount,
            crypto,
            deposit_address
        })

        await Notification.create({
            user: req.user,
            title: `deposit success`,
            content: `Your deposit amount of $${amount} was successful, pending confirmation.`,
            URL: '/dashboard/deposit',
        })

        const admins = await User.findAll({ where: { role: 'admin' } })

        if (admins) {
            admins.map(async ele => {
                await Notification.create({
                    user: ele.id,
                    title: `deposit alert`,
                    content: `Hello Admin, ${depositUser} just made a deposit of $${amount} with ${crypto}, please confirm transaction.`,
                    URL: '/admin-controls',
                })

                const content = `<div font-size: 1rem;>Admin, ${depositUser} just made a deposit of $${amount} with ${crypto}, please confirm transaction.</div> `

                await sendMail({ subject: 'Deposit Alert', to: ele.email, html: content, text: content })
            })
        }

        const notifications = await Notification.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        const unreadnotis = await Notification.findAll({
            where: { user: req.user, read: 'false' },
        })

        return res.json({ status: 200, msg: 'Deposit success', notis: notifications, unread: unreadnotis })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.DepositsFromUser = async (req, res) => {
    try {
        const deposits = await Deposit.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: deposits })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}
