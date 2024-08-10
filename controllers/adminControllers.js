const User = require('../models').users
const Investment = require('../models').investments
const Deposit = require('../models').deposits
const Notification = require('../models').notifications
const Withdrawal = require('../models').withdrawals
const Wallet = require('../models').wallets
const AdminWallet = require('../models').admin_wallets
const TradingPlans = require('../models').trading_plans
const Up = require('../models').ups
const fs = require('fs')
const slug = require('slug')
const sendMail = require('../config/emailConfig')


exports.AllDeposits = async (req, res) => {
    try {
        const deposits = await Deposit.findAll({
            include: [
                {
                    model: User,
                    as: 'depositUser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })
        return res.json({ status: 200, msg: deposits })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.UpdateDeposits = async (req, res) => {

    try {
        const { user_id, status, deposit_id } = req.body
        const depositUser = await User.findOne({ where: { id: user_id } })
        if (!depositUser) return res.json({ status: 400, msg: 'Deposit User not found' })
        const deposit = await Deposit.findOne({ where: { id: deposit_id } })
        if (!deposit) return res.json({ status: 400, msg: 'Deposit not found' })

        if (deposit.status !== 'confirmed') {

            if (status === 'confirmed') {

                await Notification.create({
                    user: user_id,
                    title: `deposit confirmed`,
                    content: `Your deposit amount of $${deposit.amount} confirmed. Check your wallet for your available balance.`,
                    URL: '/dashboard',
                })

                const wallet = await Wallet.findOne({ where: { user: user_id } })
                if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
                wallet.total_deposit += deposit.amount
                wallet.balance += deposit.amount
                await wallet.save()

                const content = `<div font-size: 1rem;>Hello ${depositUser.username}, your deposit of $${deposit.amount} has been successfully confirmed.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Deposit Confirmation', to: depositUser.email, html: content, text: content })
            }
        }

        if (deposit.status !== 'failed') {
            if (status === 'failed') {

                await Notification.create({
                    user: user_id,
                    title: `deposit failed`,
                    content: `Your deposit amount of $${deposit.amount} confirmation failed. This deposit was not confirmed.`,
                    status: 'failed',
                    URL: '/dashboard/deposit',
                })
            }
        }

        deposit.status = status

        await deposit.save()

        const deposits = await Deposit.findAll({
            include: [
                {
                    model: User,
                    as: 'depositUser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: deposits })

    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.AllInvestments = async (req, res) => {
    try {
        const investments = await Investment.findAll({
            include: [
                {
                    model: User,
                    as: 'investmentUser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: investments })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.UpdateInvestments = async (req, res) => {

    try {
        const { user_id, status, investment_id, profit, bonus, } = req.body
        const investmentUser = await User.findOne({ where: { id: user_id } })
        if (!investmentUser) return res.json({ status: 400, msg: 'Investment User not found' })
        const investment = await Investment.findOne({ where: { id: investment_id } })
        if (!investment) return res.json({ status: 400, msg: 'Investment not found' })

        if (investment.status !== 'completed') {
            if (status === 'completed') {

                await Notification.create({
                    user: user_id,
                    title: `profit completed`,
                    content: `Profits for your $${investment.amount} ${investment.trading_plan} investment is completed. Check your investment portfolio to claim.`,
                    URL: '/dashboard/investment',
                })

                const content = `<div font-size: 1rem;>Hello ${investmentUser.username}, your profits generated for the investment of $${investment.amount} ${investment.trading_plan} has been completed, you can now succesfully claim to your wallet.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Profit Completed', to: investmentUser.email, html: content, text: content })
            }
        }

        investment.status = status
        if (profit) {
            investment.profit += profit
        }
        if (bonus) {
            investment.bonus += bonus
        }

        await investment.save()

        const investments = await Investment.findAll({
            include: [
                {
                    model: User,
                    as: 'investmentUser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: investments })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}


exports.AllUsers = async (req, res) => {
    try {

        const users = await User.findAll({
            where: { role: 'user' },
            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: users })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}


exports.DeleteUser = async (req, res) => {

    try {
        const { user_id, password } = req.body
        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 400, msg: 'User not found' })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 400, msg: `Admin not found` })
        if (password !== findAdmin.password) return res.json({ status: 404, msg: `Invalid password` })

        const imagePath = `./public/profiles/${user.image}`
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
        }


        const wallet = await Wallet.findOne({
            where: { user: user_id }
        })

        const ups = await Up.findOne({
            where: { user: user_id },
        })

        const deposits = await Deposit.findAll({
            where: { user: user_id },
        })

        if (deposits) {
            deposits.map(async ele => {
                await ele.destroy()
            })
        }

        const investments = await Investment.findAll({
            where: { user: user_id }
        })

        if (investments) {
            investments.map(async ele => {
                await ele.destroy()
            })
        }

        const notifications = await Notification.findAll({
            where: { user: user_id },
        })

        if (notifications) {
            notifications.map(async ele => {
                await ele.destroy()
            })
        }

        const withdrawals = await Withdrawal.findAll({
            where: { user: user_id },
        })

        if (withdrawals) {
            withdrawals.map(async ele => {
                await ele.destroy()
            })
        }
        if (wallet) {
            await wallet.destroy()
        }
        if (ups) {
            await ups.destroy()
        }

        await user.destroy()

        const users = await User.findAll({
            where: { role: 'user' },
            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: users})
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}


exports.GetUserFigures = async (req, res) => {

    try {
        const { user_id } = req.body
        if (!user_id) return res.json({ status: 404, msg: `Provide a user id` })
        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 404, msg: 'User not found' })

        const userdeposit = await Deposit.findAll({
            where: { user: user_id, status: 'confirmed' }
        })

        const userFigures = {
            total_investment: 0,
            wallet_balance: 0
        }

        userdeposit.map(item => {
            userFigures.total_investment += item.amount
        })

        const wallet = await Wallet.findOne({ where: { user: user_id } })
        if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
        userFigures.wallet_balance = wallet.balance

        return res.json({ status: 200, msg: userFigures })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.AllWithdrawals = async (req, res) => {
    try {
        const withdrawals = await Withdrawal.findAll({
            include: [
                {
                    model: User,
                    as: 'wthUser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: withdrawals })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.UpdateWithdrawals = async (req, res) => {
    try {
        const { user, status, withdrawal_id } = req.body
        const withdrawaluser = await User.findOne({ where: { id: user } })
        if (!withdrawaluser) return res.json({ status: 400, msg: 'Withdrawal user not found' })
        const withdrawal = await Withdrawal.findOne({ where: { id: withdrawal_id } })
        if (!withdrawal) return res.json({ status: 400, msg: 'Withdrawal not found' })

        if (withdrawal.status !== 'confirmed') {

            if (status === 'confirmed') {

                await Notification.create({
                    user: user,
                    title: `withdrawal confirmed`,
                    content: `Your withdrawal amount of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address?.slice(0, 5)}....${withdrawal.wallet_address?.slice(-10)} has been confirmed.`,
                    URL: '/dashboard/withdraw',
                })

                const content = `<div font-size: 1rem;>Hello ${withdrawaluser.username}, your withdrawal of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address} has been confirmed.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Withdrawal Confirmation', to: withdrawaluser.email, html: content, text: content })
            }
        }

        withdrawal.status = status
        await withdrawal.save()

        const withdrawals = await Withdrawal.findAll({
            include: [
                {
                    model: User,
                    as: 'wthUser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: withdrawals})

    } catch (error) {
        return res.json({ status: 200, msg: error.message })
    }
}


exports.CreateAdminWallets = async (req, res) => {
    try {

        const { crypto, network, address, } = req.body
        if (!crypto || !network || !address) return res.json({ status: 404, msg: `Incomplete request found` })
        const findCrypto = await AdminWallet.findOne({ where: { crypto: crypto } })
        if (findCrypto) return res.json({ status: 404, msg: `${crypto} wallet already exists` })
        if (!req.files) return res.json({ status: 404, msg: `Crypto image and Qr scan code image are required` })

        const crypto_img = req.files.crypto_img
        const qrcode_img = req.files.qrcode_img

        const filePath = './public/cryptocurrency'
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath)
        }

        const cryptoImgName = `${slug(crypto, '-')}.jpg`
        const qrCodeImgName = `${slug(network, '-')}.jpg`

        await qrcode_img.mv(`${filePath}/${qrCodeImgName}`)
        await crypto_img.mv(`${filePath}/${cryptoImgName}`)


        await AdminWallet.create({
            crypto,
            network,
            address,
            crypto_img: cryptoImgName,
            qrcode_img: qrCodeImgName,
        })

        const adminWallets = await AdminWallet.findAll({
        })

        return res.json({ status: 200, msg: adminWallets })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.GetAdminWallets = async (req, res) => {
    try {
        const adminWallets = await AdminWallet.findAll({
        })

        return res.json({ status: 200, msg: adminWallets })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}


exports.UpdateAdminWallet = async (req, res) => {
    try {
        const { crypto, network, address, wallet_id } = req.body
        if (!wallet_id) return res.json({ status: 404, msg: `Provide Wallet id` })
        const adminWallet = await AdminWallet.findOne({ where: { id: wallet_id } })
        if (!adminWallet) return res.json({ status: 404, msg: 'Wallet not found' })

        const crypto_img = req?.files?.crypto_img
        const qrcode_img = req?.files?.qrcode_img

        let cryptoImgName;
        let qrCodeImgName;

        const filePath = './public/cryptocurrency'
        const currentCryptoImgPath = `${filePath}/${adminWallet.crypto_img}`
        const currentQrCodeImgPath = `${filePath}/${adminWallet.qrcode_img}`

        if (crypto_img) {

            if (fs.existsSync(currentCryptoImgPath)) {
                fs.unlinkSync(currentCryptoImgPath)
            }

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath)
            }

            if (crypto) {
                cryptoImgName = `${slug(crypto, '-')}.jpg`
            } else {
                cryptoImgName = `${slug(adminWallet.crypto, '-')}.jpg`
            }
        }

        if (qrcode_img) {

            if (fs.existsSync(currentQrCodeImgPath)) {
                fs.unlinkSync(currentQrCodeImgPath)
            }

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath)
            }

            if (network) {
                qrCodeImgName = `${slug(network, '-')}.jpg`
            } else {
                qrCodeImgName = `${slug(adminWallet.network, '-')}.jpg`
            }
        }

        if (crypto_img) {
            await crypto_img.mv(`${filePath}/${cryptoImgName}`)
        }
        if (qrcode_img) {
            await qrcode_img.mv(`${filePath}/${qrCodeImgName}`)
        }

        if (crypto_img) {
            adminWallet.crypto_img = cryptoImgName
        }
        if (qrcode_img) {
            adminWallet.qrcode_img = qrCodeImgName
        }
        if (crypto) {
            adminWallet.crypto = crypto
        }
        if (network) {
            adminWallet.network = network
        }
        if (address) {
            adminWallet.address = address
        }

        await adminWallet.save()

        const adminWallets = await AdminWallet.findAll({
        })

        return res.json({ status: 200, msg: adminWallets})
    } catch (error) {
        res.json({ status: 400, msg: error.message })
    }
}


exports.DeleteWallet = async (req, res) => {
    try {
        const { wallet_id } = req.body
        if (!wallet_id) return res.json({ status: 404, msg: `Provide your Wallet id` })
        const adminWallet = await AdminWallet.findOne({ where: { id: wallet_id } })
        if (!adminWallet) return res.json({ status: 404, msg: 'Wallet not found' })


        const CryptoImgPath = `./public/cryptocurrency/${adminWallet.crypto_img}`
        if (fs.existsSync(CryptoImgPath)) {
            fs.unlinkSync(CryptoImgPath)
        }

        const QrImgPath = `./public/cryptocurrency/${adminWallet.qrcode_img}`
        if (fs.existsSync(QrImgPath)) {
            fs.unlinkSync(QrImgPath)
        }

        await adminWallet.destroy()

        const adminWallets = await AdminWallet.findAll({
        })

        return res.json({ status: 200, msg: adminWallets})
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.CreateTradingPlan = async (req, res) => {
    try {

        const { title, price_start, price_limit, plan_bonus } = req.body
        if (!title || !price_start || !price_limit || !plan_bonus) return res.json({ status: 404, msg: `Incomplete request found` })
        const findPlan = await TradingPlans.findOne({ where: { title: title } })
        if (findPlan) return res.json({ status: 404, msg: `${title} already exists` })

        await TradingPlans.create({
            title,
            price_start,
            price_limit,
            plan_bonus
        })

        const tradingplans = await TradingPlans.findAll({
        })

        return res.json({ status: 200, msg: tradingplans})
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.GetTradingPlans = async (req, res) => {
    try {
        const tradingplans = await TradingPlans.findAll({
        })

        return res.json({ status: 200, msg: tradingplans })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UpdateTradingPlan = async (req, res) => {
    try {
        const { title, price_start, price_limit, plan_bonus, plan_id } = req.body
        if (!plan_id) return res.json({ status: 404, msg: `Provide trading plan id` })
        const tradingPlan = await TradingPlans.findOne({ where: { id: plan_id } })
        if (!tradingPlan) return res.json({ status: 404, msg: 'Trading plan not found' })

        if (title) {
            tradingPlan.title = title
        }
        if (price_start) {
            tradingPlan.price_start = price_start
        }
        if (price_limit) {
            tradingPlan.price_limit = price_limit
        }
        if (plan_bonus) {
            tradingPlan.plan_bonus = plan_bonus
        }

        await tradingPlan.save()

        const tradingplans = await TradingPlans.findAll({
        })

        return res.json({ status: 200, msg: tradingplans})
    } catch (error) {
        res.json({ status: 400, msg: error.message })
    }
}

exports.DeleteTradingPlan = async (req, res) => {
    try {
        const { plan_id } = req.body
        if (!plan_id) return res.json({ status: 404, msg: `Provide trading plan id` })
        const tradingPlan = await TradingPlans.findOne({ where: { id: plan_id } })
        if (!tradingPlan) return res.json({ status: 404, msg: 'Trading plan not found' })

        await tradingPlan.destroy()

        const tradingplans = await TradingPlans.findAll({
        })

        return res.json({ status: 200, msg: tradingplans})
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.FundUserAccount = async (req, res) => {
    try {
        const { user_id, amount } = req.body
        if (!user_id || !amount) return res.json({ status: 404, msg: `Incomplete request` })
        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 404, msg: 'User not found'})
        const wallet = await Wallet.findOne({ where: { user: user_id } })
        if (!wallet) return res.json({ status: 404, msg: 'User wallet not found'})

        wallet.balance += amount
        await wallet.save()

        await Notification.create({
            user: user_id,
            title: `wallet funded`,
            content: `Your account has been funded with $${amount}, check your balance.`,
            URL: '/dashboard',
        })

        return res.json({ status: 200, msg: 'User account funded successfully' })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}
