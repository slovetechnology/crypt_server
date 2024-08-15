const User = require('../models').users
const Investment = require('../models').investments
const Deposit = require('../models').deposits
const Notification = require('../models').notifications
const Withdrawal = require('../models').withdrawals
const Wallet = require('../models').wallets
const AdminWallet = require('../models').admin_wallets
const TradingPlans = require('../models').trading_plans
const AdminStore = require('../models').admin_store
const Tax = require('../models').taxes
const fs = require('fs')
const slug = require('slug')
const sendMail = require('../config/emailConfig')
const otpGenerator = require('otp-generator')


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

        return res.json({ status: 200, msg: 'Deposit updated successfully' })
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

        return res.json({ status: 200, msg: 'Investment updated successfully' })
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


exports.Suspend_Unsuspend_User = async (req, res) => {

    try {
        const { user_id, password } = req.body
        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 400, msg: 'User not found' })
        const findAdmin = await User.findOne({ where: { id: req.user } })
        if (!findAdmin) return res.json({ status: 400, msg: `Admin not found` })
        if (password !== findAdmin.password) return res.json({ status: 404, msg: `Invalid password` })

        if (user.suspend === 'false') {
            user.suspend = 'true'
        } else {
            user.suspend = 'false'
        }

        await user.save()

        return res.json({ status: 200, msg: 'Action successful' })
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
        const { user_id, status, message, withdrawal_id } = req.body
        const withdrawaluser = await User.findOne({ where: { id: user_id } })
        if (!withdrawaluser) return res.json({ status: 400, msg: 'Withdrawal user not found' })
        const withdrawal = await Withdrawal.findOne({ where: { id: withdrawal_id } })
        if (!withdrawal) return res.json({ status: 400, msg: 'Withdrawal not found' })

        if (withdrawal.status !== 'confirmed') {

            if (status === 'confirmed') {

                await Notification.create({
                    user: user_id,
                    title: `withdrawal confirmed`,
                    content: `Your withdrawal amount of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address?.slice(0, 5)}....${withdrawal.wallet_address?.slice(-10)} has been confirmed.`,
                    URL: '/dashboard/withdraw',
                })

                const content = `<div font-size: 1rem;>Hello ${withdrawaluser.username}, your withdrawal of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address} has been confirmed.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Withdrawal Confirmation', to: withdrawaluser.email, html: content, text: content })
            }
        }

        if (message) {

            await Notification.create({
                user: user_id,
                title: `Support Team`,
                content: message,
                URL: '/dashboard/tax-payment',
            })

            await sendMail({ from: 'support@secureinvest.org', subject: 'Support Team', to: withdrawaluser.email, html: message, text: message })
        }

        withdrawal.status = status
        await withdrawal.save()

        return res.json({ status: 200, msg: 'Withdrawal updated successfully' })

    } catch (error) {
        return res.json({ status: 200, msg: error.message })
    }
}


exports.CreateAdminWallets = async (req, res) => {
    try {

        const { crypto, network, address, } = req.body
        if (!crypto || !network || !address) return res.json({ status: 404, msg: `Incomplete request found` })
        const matchingCrypto = await AdminWallet.findOne({ where: { crypto: crypto } })
        if (matchingCrypto) return res.json({ status: 404, msg: 'Exact crypto name already exists' })
        const matchingNetwork = await AdminWallet.findOne({ where: { network: network } })
        if (matchingNetwork) return res.json({ status: 404, msg: 'Exact network name already exists' })
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

        return res.json({ status: 200, msg: 'Wallet created successfully' })
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

        return res.json({ status: 200, msg: 'Wallet updated successfully' })
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

        return res.json({ status: 200, msg: 'Wallet deleted successfully' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.CreateTradingPlan = async (req, res) => {
    try {

        const { title, price_start, price_limit, profit_percentage, plan_bonus, duration, duration_type } = req.body
        if (!title || !price_start || !price_limit || !profit_percentage || !plan_bonus || !duration || !duration_type) return res.json({ status: 404, msg: `Incomplete request found` })
        const findPlan = await TradingPlans.findOne({ where: { title: title } })
        if (findPlan) return res.json({ status: 404, msg: `${title} already exists` })

        await TradingPlans.create({
            title,
            price_start,
            price_limit,
            profit_percentage,
            plan_bonus,
            duration,
            duration_type
        })

        return res.json({ status: 200, msg: 'Trading plan created successfully' })
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
        const { plan_id, title, price_start, price_limit, profit_percentage, plan_bonus, duration, duration_type } = req.body
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
        if (profit_percentage) {
            tradingPlan.profit_percentage = profit_percentage
        }
        if (plan_bonus) {
            tradingPlan.plan_bonus = plan_bonus
        }
        if (duration) {
            tradingPlan.duration = duration
        }
        if (duration_type) {
            tradingPlan.duration_type = duration_type
        }

        await tradingPlan.save()

        return res.json({ status: 200, msg: 'Trading plan updated successfully' })
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

        return res.json({ status: 200, msg: 'Trading plan deleted successfully' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.FundUserAccount = async (req, res) => {
    try {
        const { user_id, amount } = req.body
        if (!user_id || !amount) return res.json({ status: 404, msg: `Incomplete request` })
        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 404, msg: 'User not found' })
        const wallet = await Wallet.findOne({ where: { user: user_id } })
        if (!wallet) return res.json({ status: 404, msg: 'User wallet not found' })

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

exports.UpdateUserWithdrawalMinimum = async (req, res) => {

    try {
        const { user_id, withdrawal_minimum } = req.body
        if (!withdrawal_minimum) return res.json({ status: 400, msg: 'Enter user withdrawal minimum' })
        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 400, msg: 'User not found' })

        if (withdrawal_minimum) {
            user.withdrawal_minimum = withdrawal_minimum
        }

        await user.save()

        return res.json({ status: 200, msg: 'User withdrawal minimum updated' })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.GetAdminStore = async (req, res) => {
    try {
        const adminStore = await AdminStore.findOne({
        })

        return res.json({ status: 200, msg: adminStore })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UpdateAdminStore = async (req, res) => {

    try {
        const { referral_bonus, tax_percentage } = req.body

        const adminStore = await AdminStore.findOne({
        })
        if (!adminStore) return res.json({ status: 400, msg: 'Admin Store not found' })

        if (referral_bonus) {
            adminStore.referral_bonus = referral_bonus
        }
        if (tax_percentage) {
            adminStore.tax_percentage = tax_percentage
        }

        await adminStore.save()

        const updated = await AdminStore.findOne({
        })

        return res.json({ status: 200, msg: updated })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.AllTaxes = async (req, res) => {
    try {
        const taxes = await Tax.findAll({
            include: [
                {
                    model: User,
                    as: 'taxPayer',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })
        return res.json({ status: 200, msg: taxes })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.UpdateTaxes = async (req, res) => {
    try {
        const { user_id, status, message, tax_id } = req.body
        const taxPayer = await User.findOne({ where: { id: user_id } })
        if (!taxPayer) return res.json({ status: 400, msg: 'Tax Payer not found' })
        const tax = await Tax.findOne({ where: { id: tax_id } })
        if (!tax) return res.json({ status: 400, msg: 'tax not found' })

        if (tax.status !== 'received') {

            if (status === 'received') {

                await Notification.create({
                    user: user_id,
                    title: `tax received`,
                    content: `Your tax payment amount of $${tax.amount} has been received and your taxes cleared.`,
                    URL: '/dashboard/tax-payment',
                })

                const content = `<div font-size: 1rem;>Hello ${taxPayer.username}, tax payment amount of $${tax.amount} has been received and your taxes cleared.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Tax Cleared', to: taxPayer.email, html: content, text: content })
            }
        }

        if (tax.status !== 'failed') {

            if (status === 'failed') {

                await Notification.create({
                    user: user_id,
                    title: `tax receival failed`,
                    content: `Your tax payment amount of $${tax.amount} receival failed. This payment was not confirmed.`,
                    status: 'failed',
                    URL: '/dashboard/tax-payment',
                })
            }
        }

        if (message) {

            await Notification.create({
                user: user_id,
                title: `Support Team`,
                content: message,
                URL: '/dashboard/tax-payment',
            })

            await sendMail({ from: 'support@secureinvest.org', subject: 'Support Team', to: taxPayer.email, html: message, text: message })
        }

        tax.status = status
        await tax.save()

        return res.json({ status: 200, msg: 'Tax updated successfully' })

    } catch (error) {
        return res.json({ status: 200, msg: error.message })
    }
}

exports.AdminCreateAccount = async (req, res) => {
    try {
        const { full_name, username, email, country, country_flag, password, role } = req.body
        if (!full_name) return res.json({ status: 404, msg: `Your full name is required` })
        if (!username) return res.json({ status: 404, msg: `Username is required` })
        if (!email) return res.json({ status: 404, msg: `Email address is required` })
        if (!country) return res.json({ status: 404, msg: `Country is required` })
        if (!country_flag) return res.json({ status: 404, msg: `Country flag is required` })
        if (!password) return res.json({ status: 404, msg: `Password is required` })
        if (password.length < 6) return res.json({ status: 404, msg: `Password must be at least 6 characters` })
        if (!role) return res.json({ status: 404, msg: `Role is required` })

        const findUsername = await User.findOne({ where: { username: username } })
        if (findUsername) return res.json({ status: 400, msg: `Username already exists` })
        const findEmail = await User.findOne({ where: { email: email } })
        if (findEmail) return res.json({ status: 400, msg: `Email already exists` })

        const myReferralId = 'AI_' + otpGenerator.generate(8, { specialChars: false })

        if (role === 'user') {
            const user = await User.create({
                full_name,
                username,
                email,
                country,
                country_flag,
                password,
                email_verified: 'true',
                referral_id: myReferralId,
            })

            await Wallet.create({
                user: user.id
            })

            await Notification.create({
                user: user.id,
                title: `welcome ${username}`,
                content: 'Welcome to the AI Artification Intelligence Trading System where we focus on making crypto trading easy. Get started by making your first deposit.',
                URL: '/dashboard/deposit',
            })

        } else {
            await User.create({
                full_name,
                username,
                email,
                country,
                country_flag,
                password,
                email_verified: 'true',
                referral_id: myReferralId,
                role: role
            })
        }

        const admin = await User.findOne({ where: { role: 'admin' } })
        if (admin) {
            await Notification.create({
                user: admin.id,
                title: `${username} joins AI Algo`,
                content: `Hello Admin, you have successfully created ${full_name} as a ${role} on the system.`,
                role: 'admin',
                URL: '/admin-controls/users',
            })
        }

        const notifications = await Notification.findAll({
            where: { role: 'admin' },
            order: [['createdAt', 'DESC']],
        })

        const unreadNotifications = await Notification.findAll({
            where: { role: 'admin', read: 'false' },
        })

        return res.json({ status: 200, msg: `Account created successfully`, notis: notifications, unread: unreadNotifications })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}