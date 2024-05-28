const { Op } = require('sequelize')

const Deposit = require('../models').deposits
const Investment = require('../models').investments
const Notification = require('../models').notifications
const Up = require('../models').ups
const Wallet = require('../models').wallets



exports.UserInvestments = async (req, res) => {
    try {
        const investment = await Investment.findAll({
            where: { user: req.user, investment_status: 'confirmed' },
            order: [['createdAt', 'DESC']],
        })
        if (!investment) return res.json({ status: 404, msg: `Investment not found` })
        return res.json({ status: 200, msg: investment })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UserUnclaimInvestments = async (req, res) => {
    try {
        const investment = await Investment.findAll({
            where: {
                user: req.user, claim: 'false', 
            },
            order: [['createdAt', 'DESC']],
        })
        if (!investment) return res.json({ status: 404, msg: `Investment not found` })

        const output = []
        investment.map(ele => {
            if(['pending', 'confirmed'].includes(ele.investment_status)){
                output.push(ele)
            }
        })


        return res.json({ status: 200, msg: output })
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
            if (investment.profit_status === 'completed') {
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
                    content: `Your $${investment.amount} ${investment.trading_plan} investment, profits and bonus generated has been successfully claimed to your wallet.`,
                    URL: 'wallet',
                    URL_state: 0
                })
            }
        }

        const userinvestment = await Investment.findAll({
            where: { user: req.user, investment_status: 'confirmed' },
            order: [['createdAt', 'DESC']],
        })

        return res.json({ status: 200, msg: userinvestment })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

