const { Op } = require('sequelize')
const Investment = require('../models').investments
const Notification = require('../models').notifications
const Up = require('../models').ups
const Wallet = require('../models').wallets
const User = require('../models').users



exports.CreateInvestment = async (req, res) => {
    try {
        const { amount, trading_plan, investmentUser } = req.body
        if (!amount || !trading_plan || !investmentUser) return res.json({ status: 404, msg: `Incomplete request found` })

        if (trading_plan === 'test run') {
            const investments = await Investment.findAll({ where: { user: req.user } })
            const TestRunTrial = investments.filter(item => item.trading_plan === 'test run')
            if (TestRunTrial.length > 0) return res.json({ status: 404, msg: `Test Run is one trial only` })
            if (investments.length > 0) return res.json({ status: 404, msg: `Test Run is for first investment only` })
        }

        await Investment.create({
            user: req.user,
            amount,
            trading_plan,
            profit: 0,
            bonus: 0,
        })

        const wallet = await Wallet.findOne({ where: { user: req.user } })
        if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
        wallet.balance -= amount
        await wallet.save()

        await Notification.create({
            user: req.user,
            title: `investment success`,
            content: `You've successfully bought ${trading_plan} for $${amount} from wallet balance, check your investment portfolio as trading begins now.`,
            URL: '/dashboard/investment',
        })

        const admin = await User.findOne({ where: { role: 'admin' } })
        if (admin) {
            await Notification.create({
                user: admin.id,
                title: `investment alert`,
                content: `Hello Admin, ${investmentUser} just made an investment of $${amount} ${trading_plan}, trading begins now.`,
                role: 'admin',
                URL: '/admin-controls/investments',
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

        return res.json({ status: 200, msg: 'Investment success' })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UserInvestments = async (req, res) => {
    try {
        const investments = await Investment.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: investments })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UserUnclaimInvestments = async (req, res) => {
    try {
        const investments = await Investment.findAll({
            where: {
                user: req.user, claim: 'false',
            },
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: investments })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.ClaimInvestment = async (req, res) => {
    try {
        const { invest_id } = req.body
        const investment = await Investment.findOne({ where: { id: invest_id } })
        if (!investment) return res.json({ status: 404, msg: `User investment not found` })
        const wallet = await Wallet.findOne({ where: { user: req.user } })
        if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
        const ups = await Up.findOne({ where: { user: req.user } })
        if (!ups) return res.json({ status: 404, msg: `User ups not found` })

        if (investment.claim !== 'true') {
            if (investment.status === 'completed') {
                wallet.total_profit += investment.profit
                wallet.total_bonus += investment.bonus
                let altbalance = investment.amount + investment.profit + investment.bonus
                wallet.balance += altbalance
                await wallet.save()

                ups.new_profit = investment.profit
                ups.new_bonus = investment.bonus
                await ups.save()

                investment.claim = 'true'
                await investment.save()

                await Notification.create({
                    user: req.user,
                    title: `claim success`,
                    content: `Your $${investment.amount} ${investment.trading_plan} investment, profit and bonus generated has been successfully claimed to your wallet.`,
                    URL: '/dashboard',
                })
            }
        }

        const notifications = await Notification.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        const unreadnotis = await Notification.findAll({
            where: { user: req.user, read: 'false' },
        })

        return res.json({ status: 200, msg: 'Investment claimed successfully', notis: notifications, unread: unreadnotis })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

