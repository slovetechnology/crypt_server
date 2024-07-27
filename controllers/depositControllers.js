const sendMail = require('../config/emailConfig')

const Deposit = require('../models').deposits
const Investment = require('../models').investments
const Notification = require('../models').notifications
const Up = require('../models').ups
const Wallet = require('../models').wallets
const User = require('../models').users

exports.CreateDeposit = async (req, res) => {
    try {

        const { amount, trading_plan, crypto, from, deposituser } = req.body
        if (!amount || !trading_plan || !crypto || !from || !deposituser) return res.json({ status: 404, msg: `Incomplete request found` })


        if (from === 'external source') {
            await Deposit.create({
                amount,
                trading_plan,
                crypto,
                from,
                user: req.user,
                profit: 0,
                bonus: 0
            })

            await Investment.create({
                user: req.user,
                amount,
                trading_plan,
                crypto,
                profit: 0,
                bonus: 0,
            })

            const content = `<div font-size: 1rem;>Admin, ${deposituser} just made a deposit of $${amount} for ${trading_plan} with ${crypto}, please confirm transaction.</div> `

            const admin = await User.findOne({ where: { role: 'admin' } })
            await sendMail({ from: 'support@secureinvest.org', subject: 'Deposit Alert', to: admin.email, html: content, text: content })
        }
        if (from === 'wallet balance') {
            await Deposit.create({
                amount,
                trading_plan,
                crypto,
                from,
                user: req.user,
                profit: 0,
                bonus: 0,
                deposit_status: 'confirmed'
            })

            await Investment.create({
                user: req.user,
                amount,
                trading_plan,
                crypto,
                profit: 0,
                bonus: 0,
                investment_status: 'confirmed',
            })

            const wallet = await Wallet.findOne({ where: { user: req.user } })
            if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
            wallet.balance -= amount
            await wallet.save()
        }


        if (from === 'external source') {
            await Notification.create({
                user: req.user,
                title: `deposit success`,
                content: `Your deposit amount of $${amount} for ${trading_plan} was successful, pending aprroval.`,
                URL: 'deposit',
                URL_state: 1
            })

            const admin = await User.findOne({ where: { role: 'admin' } })
            await Notification.create({
                user: admin.id,
                title: `deposit alert`,
                content: `Hello Admin, ${deposituser} just made a deposit of $${amount} for ${trading_plan}, kindly confirm transaction so trading can begin.`,
                role: 'admin'
            })
        }

        if (from === 'wallet balance') {
            await Notification.create({
                user: req.user,
                title: `investment success`,
                content: `You've successfully bought ${trading_plan} for $${amount} from your wallet balance, check your investment portfolio as your trading begins now.`,
                URL: 'investment',
                URL_state: 0
            })

            const admin = await User.findOne({where: {role: 'admin'}})
            await Notification.create({
                user: admin.id,
                title: `investment alert`,
                content: `Hello Admin, ${deposituser} just made an investment of $${amount} ${trading_plan} from wallet balance, trading begins now.`,
                role: 'admin'
            })
        }

        const ups = await Up.findOne({ where: { user: req.user } })
        if (!ups) {
            await Up.create({
                new_profit: 0,
                new_bonus: 0,
                user: req.user
            })
        }

        const deposits = await Deposit.findAll({
            where: { user: req.user, from: 'external source' },
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
            where: { user: req.user, from: 'external source' },
            order: [['createdAt', 'DESC']],
        })


        return res.json({ status: 200, msg: deposits })

    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}
