const sendMail = require('../config/emailConfig')
const Deposit = require('../models').deposits
const Notification = require('../models').notifications
const User = require('../models').users

exports.CreateDeposit = async (req, res) => {
    try {

        const { amount, crypto, depositUser } = req.body
        if (!amount || !crypto || !depositUser) return res.json({ status: 404, msg: `Incomplete request found` })

        await Deposit.create({
            user: req.user,
            amount,
            crypto
        })

        const content = `<div font-size: 1rem;>Admin, ${depositUser} just made a deposit of $${amount} with ${crypto} please confirm transaction.</div> `

        const admin = await User.findOne({ where: { role: 'admin' } })
        await sendMail({ from: 'support@secureinvest.org', subject: 'Deposit Alert', to: admin.email, html: content, text: content })

        await Notification.create({
            user: req.user,
            title: `deposit success`,
            content: `Your deposit amount of $${amount} was successful, pending aprroval.`,
            URL: 'deposit',
            URL_state: 1
        })

        if (admin) {
            await Notification.create({
                user: admin.id,
                title: `deposit alert`,
                content: `Hello Admin, ${depositUser} just made a deposit of $${amount} with ${crypto}, please confirm transaction.`,
                role: 'admin'
            })
        }

        const deposits = await Deposit.findAll({
            where: { user: req.user},
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: deposits })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.DepositsFromUser = async (req, res) => {
    try {
        const deposits = await Deposit.findAll({
            where: { user: req.user},
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: deposits })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}
