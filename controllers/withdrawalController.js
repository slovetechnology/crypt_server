const sendMail = require('../config/emailConfig')

const Withdrawal = require('../models').withdrawals
const Notification = require('../models').notifications
const Wallet = require('../models').wallets
const User = require('../models').users

exports.MakeWithdrawal = async (req, res) => {
    try {

        const { amount, wallet_address, crypto, network, wthuser } = req.body
        if (!amount || !wallet_address || !crypto || !network || !wthuser) return res.json({ status: 404, msg: `Incomplete request found` })

        await Withdrawal.create({
            amount,
            wallet_address,
            crypto,
            network,
            user: req.user,
        })

        await Notification.create({
            user: req.user,
            title: `withdrawal success`,
            content: `Your withdrawal amount of $${amount} was successful, now processing.`,
            URL: '/dashboard/withdraw',
        })

        const admin = await User.findOne({ where: { role: 'admin' } })
        if (admin) {
            await Notification.create({
                user: admin.id,
                title: `withdrawal alert`,
                content: `Hello Admin, ${wthuser} just made a withdrawal of $${amount}.`,
                role: 'admin',
                URL: '/admin-controls/withdrawals',
            })

            const content = `<div font-size: 1rem;>Hello Admin, ${wthuser} just made a withdrawal of $${amount} for ${wallet_address} on ${network}.</div> `

            if (admin) {
                await sendMail({ subject: 'Withdrawal Alert', to: admin.email, html: content, text: content })
            }
        }

        const wallet = await Wallet.findOne({ where: { user: req.user } })
        if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
        wallet.total_withdrawal += amount
        wallet.balance -= amount
        await wallet.save()

        const notifications = await Notification.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        const unreadnotis = await Notification.findAll({
            where: { user: req.user, read: 'false' },
        })

        const updatedwallet = await Wallet.findOne({ where: { user: req.user } })

        return res.json({ status: 200, msg: 'Withdrawal success', notis: notifications, unread: unreadnotis, wallet: updatedwallet })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.WithdrawalsFromUser = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: withdrawals })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}