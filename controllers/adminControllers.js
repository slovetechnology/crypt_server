const User = require('../models').users
const Investment = require('../models').investments
const Deposit = require('../models').deposits
const Notification = require('../models').notifications
const Withdrawal = require('../models').withdrawals
const Wallet = require('../models').wallets
const Crypto = require('../models').crypto
const AdminWallet = require('../models').admin_wallets
const TradingPlans = require('../models').trading_plans
const AdminStore = require('../models').admin_store
const Tax = require('../models').taxes
const Kyc = require('../models').kyc
const fs = require('fs')
const slug = require('slug')
const sendMail = require('../config/emailConfig')
const otpGenerator = require('otp-generator')
var cron = require('node-cron');
const moment = require('moment')
require('dotenv').config()



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
        if (!user_id, !deposit_id) return res.json({ status: 404, msg: `Invalid request` })

        const deposit = await Deposit.findOne({ where: { id: deposit_id } })
        if (!deposit) return res.json({ status: 400, msg: 'Deposit not found' })

        const depositUser = await User.findOne({ where: { id: user_id } })
        if (!depositUser) return res.json({ status: 400, msg: 'Deposit User not found' })

        if (deposit.status !== 'confirmed') {

            if (status === 'confirmed') {

                const wallet = await Wallet.findOne({ where: { user: user_id } })
                if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
                wallet.total_deposit += deposit.amount
                wallet.balance += deposit.amount
                await wallet.save()

                await Notification.create({
                    user: user_id,
                    title: `deposit confirmed`,
                    content: `Your deposit amount of $${deposit.amount} confirmed. Check your wallet for your available balance.`,
                    URL: '/dashboard',
                })

                const content = `
        <div style="padding-right: 1rem; padding-left: 1rem; margin-top: 2.5rem">
         <img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725460513/myfolder/aoasjh8mldxsezfs9cbe.png' style="width: 4rem; height: auto" />
         <div style="padding-top: 1.2rem; padding-bottom: 1.2rem; border-top: 1px solid lightgrey; margin-top: 1rem">
             <div style="font-size: 1.1rem; font-weight: bold">Deposit confirmation</div>
             <div style="margin-top: 1rem">Hello ${depositUser.username}, your deposit amount of $${deposit.amount} has been successfully confirmed. See your current balance <a href='https://aialgo.vercel.app/dashboard'  style="text-decoration: underline; color: #E96E28">here</a></div>
         </div>
         <div style="margin-top: 3rem; padding-top: 1rem; padding-bottom: 1rem; border-top: 1px solid #E96E28;">
             <div style="font-weight: bold; color: #E96E28; text-align: center">Stay connected!</div>
             <div style="display: flex; gap: 16px; align-items: center; justify-content: center; margin-top: 1rem">
                 <a href='https://www.facebook.com/profile.php?id=61560199442347&mibextid=LQQJ4d'><img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725461777/myfolder/jhjssvvwqe85g7m6ygoj.png' style="width: 1.1rem; height: 1.1rem" /></a>
                 <a href=''><img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725461786/myfolder/kbkwpgdzajsmlidyserp.png' style="width: 1rem; height: 1rem" /></a>
                 <a href=''><img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725461793/myfolder/sea7fie6r1mndax4ent8.png' style="width: 1rem; height: 1rem" /></a>
             </div>
             <div style="margin-top: 1rem; font-size: 0.85rem">If you have any questions or suggestions, please feel free to contact us via our 24/7 online help or email: ${process.env.MAIL_USER}</div>
             <div style="margin-top: 1rem;  width: fit-content; height: fit-content; background-color: #172029; color: #94A3B8; font-size: 0.75rem; padding-right: 3rem; padding-left: 3rem; padding-top: 0.75rem; padding-bottom: 0.75rem; display: flex; gap: 4px; align-items: center">
                  <div> <img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725463522/qjtwmzzj6orqraedef04.png'  style="width: 0.75rem; height: 0.75rem" /></div>
                  <div>AI Algo 2024, All rights reserved</div>.
             </div>
         </div>
        </div>
        `

                await sendMail({ subject: 'Deposit Confirmation', to: depositUser.email, html: content, text: content })

                const UserDeposits = await Deposit.findAll({ where: { user: user_id } })
                if (UserDeposits.length === 1) {
                    const findMyReferral = await User.findOne({ where: { referral_id: depositUser.my_referral } })

                    if (findMyReferral) {
                        const myReferralWallet = await Wallet.findOne({ where: { user: findMyReferral.id } })

                        if (myReferralWallet) {
                            const adminStore = await AdminStore.findOne({
                            })

                            if (adminStore) {
                                const referralBonus = deposit.amount * adminStore.referral_bonus_percentage / 100

                                myReferralWallet.referral += parseFloat(referralBonus.toFixed(1))
                                myReferralWallet.balance += parseFloat(referralBonus.toFixed(1))
                                await myReferralWallet.save()

                                await Notification.create({
                                    user: findMyReferral.id,
                                    title: `referral bonus`,
                                    content: `Your wallet has been credited with $${referralBonus}, ${adminStore.referral_bonus_percentage}% of your referral; "${depositUser.username}" first deposit. Thank you for introducing more people to our system.`,
                                    URL: '/dashboard',
                                })
                            }
                        }
                    }
                }
            }
        }

        if (deposit.status !== 'failed') {

            if (status === 'failed') {

                await Notification.create({
                    user: user_id,
                    title: `deposit failed`,
                    content: `Your deposit amount of $${deposit.amount} confirmation failed. This deposit was not confirmed.`,
                    status: 'failed',
                    URL: '/dashboard/deposit?screen=2',
                })

                const content = `<div font-size: 1rem;>Hello ${depositUser.username}, confirmation failed. This deposit was not confirmed.</div> `

                await sendMail({ subject: 'Deposit Failed', to: depositUser.email, html: content, text: content })
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
        if (!user_id, !investment_id) return res.json({ status: 404, msg: `Invalid request` })

        const investment = await Investment.findOne({ where: { id: investment_id } })
        if (!investment) return res.json({ status: 400, msg: 'Investment not found' })

        const investmentUser = await User.findOne({ where: { id: user_id } })
        if (!investmentUser) return res.json({ status: 400, msg: 'Investment User not found' })

        if (investment.status !== 'completed') {

            if (status === 'completed') {

                await Notification.create({
                    user: user_id,
                    title: `profit completed`,
                    content: `Profits for your $${investment.amount} ${investment.trading_plan} plan investment is completed. Check your investment portfolio to claim.`,
                    URL: '/dashboard/investment',
                })

                const content = `<div font-size: 1rem;>Hello ${investmentUser.username}, your profits generated for the investment of $${investment.amount} ${investment.trading_plan} plan has been completed, you can now succesfully claim to your wallet.</div> `

                await sendMail({ subject: 'Profit Completed', to: investmentUser.email, html: content, text: content })
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
        const admin = await User.findOne({ where: { id: req.user } })
        let allusers;

        if (admin.id !== 1) {
            allusers = await User.findAll({
                where: { role: 'user' },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Kyc,
                        as: 'kycUser',
                    },
                ],
            })

        } else {
            allusers = await User.findAll({
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: Kyc,
                        as: 'kycUser',
                    },
                ],
            })
        }

        return res.json({ status: 200, msg: allusers })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.AdminCreateAccount = async (req, res) => {
    try {
        const { full_name, username, email, country, country_flag, password, role } = req.body
        if (!full_name) return res.json({ status: 404, msg: `Full name is required` })
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

exports.UpdateUsers = async (req, res) => {

    try {
        const { user_id, password, fundAmount, minimumAmount } = req.body
        if (!user_id) return res.json({ status: 404, msg: `Provide a user id` })

        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 404, msg: 'User not found' })

        if (fundAmount) {
            const wallet = await Wallet.findOne({ where: { user: user_id } })
            if (!wallet) return res.json({ status: 404, msg: 'User wallet not found' })

            wallet.balance += fundAmount
            await wallet.save()

            await Notification.create({
                user: user_id,
                title: `wallet funded`,
                content: `Your account has been funded with $${fundAmount}, check your balance.`,
                URL: '/dashboard',
            })
        }

        if (minimumAmount) {
            user.withdrawal_minimum = minimumAmount
        }

        if (password) {
            const findAdmin = await User.findOne({ where: { id: req.user } })
            if (!findAdmin) return res.json({ status: 400, msg: `Admin not found` })
            if (password !== findAdmin.password) return res.json({ status: 404, msg: `Invalid password` })

            if (user.role === 'admin') {
                if (findAdmin.id !== 1) return res.json({ status: 404, msg: `Unauthorized action` })
            }

            if (user.suspend === 'false') {
                user.suspend = 'true'
            } else {
                user.suspend = 'false'
            }
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
            total_deposit: 0,
            wallet_balance: 0
        }

        userdeposit.map(item => {
            userFigures.total_deposit += item.amount
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
        if (!user_id, !withdrawal_id) return res.json({ status: 404, msg: `Invalid request` })

        const withdrawal = await Withdrawal.findOne({ where: { id: withdrawal_id } })
        if (!withdrawal) return res.json({ status: 400, msg: 'Withdrawal not found' })

        const withdrawaluser = await User.findOne({ where: { id: user_id } })
        if (!withdrawaluser) return res.json({ status: 400, msg: 'Withdrawal user not found' })

        if (withdrawal.status !== 'confirmed') {

            if (status === 'confirmed') {

                await Notification.create({
                    user: user_id,
                    title: `withdrawal confirmed`,
                    content: `Your withdrawal amount of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address?.slice(0, 5)}....${withdrawal.wallet_address?.slice(-10)} has been successfully processed.`,
                    URL: '/dashboard/withdraw?screen=2',
                })

                const content = `<div font-size: 1rem;>Hello ${withdrawaluser.username}, your withdrawal of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address} has been confirmed.</div> `

                await sendMail({ subject: 'Withdrawal Confirmation', to: withdrawaluser.email, html: content, text: content })
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
        if (!user_id, !tax_id) return res.json({ status: 404, msg: `Invalid request` })

        const tax = await Tax.findOne({ where: { id: tax_id } })
        if (!tax) return res.json({ status: 400, msg: 'tax not found' })

        const taxPayer = await User.findOne({ where: { id: user_id } })
        if (!taxPayer) return res.json({ status: 400, msg: 'Tax Payer not found' })

        if (tax.status !== 'received') {

            if (status === 'received') {

                await Notification.create({
                    user: user_id,
                    title: `tax received`,
                    content: `Your tax payment amount of $${tax.amount} has been received and the tax cleared.`,
                    URL: '/dashboard/tax-payment?screen=2',
                })

                const content = `<div font-size: 1rem;>Hello ${taxPayer.username}, your tax payment amount of $${tax.amount} has been received and your taxes cleared.</div> `

                await sendMail({ subject: 'Tax Received', to: taxPayer.email, html: content, text: content })
            }
        }

        if (tax.status !== 'failed') {

            if (status === 'failed') {

                await Notification.create({
                    user: user_id,
                    title: `tax receival failed`,
                    content: `Your tax payment amount of $${tax.amount} receival failed. This payment was not confirmed.`,
                    status: 'failed',
                    URL: '/dashboard/tax-payment?screen=2',
                })

                const content = `<div font-size: 1rem;>Hello ${taxPayer.username}, your tax payment amount of $${tax.amount} receival failed. This payment was not confirmed.</div> `

                await sendMail({ subject: 'Tax Recieval Failed', to: taxPayer.email, html: content, text: content })
            }
        }

        if (message) {

            await Notification.create({
                user: user_id,
                title: `Support Team`,
                content: message,
                URL: '/dashboard/tax-payment',
            })

            await sendMail({ subject: 'Support Team', to: taxPayer.email, html: message, text: message })
        }

        tax.status = status
        await tax.save()

        return res.json({ status: 200, msg: 'Tax updated successfully' })

    } catch (error) {
        return res.json({ status: 200, msg: error.message })
    }
}

exports.UpdateKYC = async (req, res) => {

    try {
        const { user_id, kyc_id, status, message } = req.body
        if (!user_id, !kyc_id) return res.json({ status: 404, msg: `Invalid request` })

        const kyc = await Kyc.findOne({ where: { id: kyc_id } })
        if (!kyc) return res.json({ status: 400, msg: 'KYC not found' })

        const kycUser = await User.findOne({ where: { id: user_id } })
        if (!kycUser) return res.json({ status: 400, msg: 'KYC User not found' })

        if (kyc.status !== 'verified') {

            if (status === 'verified') {

                kycUser.kyc_verified = 'true'
                await kycUser.save()

                await Notification.create({
                    user: user_id,
                    title: `KYC verified`,
                    content: `Your KYC details submitted has been successfully verified.`,
                    URL: '/dashboard/verify-account/kyc',
                })

                const content = `<div font-size: 1rem;>Hello ${kycUser.username}, Your KYC details submitted has been successfully verified.</div> `

                await sendMail({ subject: 'KYC Verification', to: kycUser.email, html: content, text: content })
            }
        }

        if (kyc.status !== 'failed') {

            if (status === 'failed') {

                if (!message) return res.json({ status: 400, msg: 'Provide a reason for failed verification' })

                await Notification.create({
                    user: user_id,
                    title: `KYC verification failed`,
                    content: message,
                    status: 'failed',
                    URL: '/dashboard/verify-account/kyc',
                })

                await sendMail({ subject: 'KYC Verification Failed', to: kycUser.email, html: message, text: message })
            }
        }

        kyc.status = status

        await kyc.save()

        return res.json({ status: 200, msg: 'KYC updated successfully' })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.CreateCryptocurrency = async (req, res) => {
    try {

        const { crypto_name } = req.body
        if (!crypto_name) return res.json({ status: 404, msg: `Incomplete request found` })
        const matchingCrypto = await Crypto.findOne({ where: { crypto_name: crypto_name } })
        if (matchingCrypto) return res.json({ status: 404, msg: 'Exact crypto already exists' })

        if (!req.files) return res.json({ status: 404, msg: `Crypto image is required` })

        const crypto_img = req.files.crypto_img

        const filePath = './public/cryptocurrency'
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath)
        }

        const cryptoImgName = `${slug(crypto_name, '-')}.jpg`

        await crypto_img.mv(`${filePath}/${cryptoImgName}`)


        await Crypto.create({
            crypto_name,
            crypto_img: cryptoImgName,
        })

        return res.json({ status: 200, msg: 'Cryptocurrency created successfully' })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.GetCryptocurrency = async (req, res) => {
    try {
        const cryptocurrency = await Crypto.findAll({
        })

        return res.json({ status: 200, msg: cryptocurrency })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UpdateCryptocurrency = async (req, res) => {
    try {
        const { crypto_name, crypto_id } = req.body
        if (!crypto_id) return res.json({ status: 404, msg: `Provide Crypto id` })

        const cryptocurrency = await Crypto.findOne({ where: { id: crypto_id } })
        if (!cryptocurrency) return res.json({ status: 404, msg: 'Crypto not found' })

        const crypto_img = req?.files?.crypto_img

        let cryptoImgName;

        const filePath = './public/cryptocurrency'
        const currentCryptoImgPath = `${filePath}/${cryptocurrency.crypto_img}`

        if (crypto_img) {

            if (fs.existsSync(currentCryptoImgPath)) {
                fs.unlinkSync(currentCryptoImgPath)
            }

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath)
            }

            if (crypto_name) {
                cryptoImgName = `${slug(crypto_name, '-')}.jpg`
            } else {
                cryptoImgName = `${slug(cryptocurrency.crypto_name, '-')}.jpg`
            }

            await crypto_img.mv(`${filePath}/${cryptoImgName}`)
        }

        if (crypto_img) {
            cryptocurrency.crypto_img = cryptoImgName
        }
        if (crypto_name) {
            cryptocurrency.crypto_name = crypto_name

            const cryptoWallets = await AdminWallet.findAll({ where: { crypto: crypto_id } })
            if (cryptoWallets) {
                cryptoWallets.map(async ele => {
                    ele.crypto_name = crypto_name
                    await ele.save()
                })
            }
        }

        await cryptocurrency.save()

        return res.json({ status: 200, msg: 'Cryptocurrency updated successfully' })
    } catch (error) {
        res.json({ status: 400, msg: error.message })
    }
}

exports.DeleteCryptocurrency = async (req, res) => {
    try {
        const { crypto_id } = req.body
        if (!crypto_id) return res.json({ status: 404, msg: `Provide Crypto id` })

        const cryptocurrency = await Crypto.findOne({ where: { id: crypto_id } })
        if (!cryptocurrency) return res.json({ status: 404, msg: 'Crypto not found' })


        const CryptoImgPath = `./public/cryptocurrency/${cryptocurrency.crypto_img}`
        if (fs.existsSync(CryptoImgPath)) {
            fs.unlinkSync(CryptoImgPath)
        }

        await cryptocurrency.destroy()

        const cryptoWallets = await AdminWallet.findAll({ where: { crypto: crypto_id } })
        if (cryptoWallets) {
            cryptoWallets.map(async ele => {

                const QrImgPath = `./public/adminWallets/${ele.qrcode_img}`
                if (fs.existsSync(QrImgPath)) {
                    fs.unlinkSync(QrImgPath)
                }

                await ele.destroy()
            })
        }

        return res.json({ status: 200, msg: 'Crypto deleted successfully' })
    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.CreateAdminWallets = async (req, res) => {
    try {

        const { crypto_id, crypto_name, network, address, } = req.body
        if (!crypto_id || !crypto_name || !network || !address) return res.json({ status: 404, msg: `Incomplete request found` })

        const matchingNetwork = await AdminWallet.findOne({ where: { network: network } })
        if (matchingNetwork) return res.json({ status: 404, msg: 'Exact network already exists' })

        if (!req.files) return res.json({ status: 404, msg: `Qr scan code image is required` })

        const qrcode_img = req.files.qrcode_img

        const filePath = './public/adminWallets'
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath)
        }

        const qrCodeImgName = `${slug(network, '-')}.jpg`

        await qrcode_img.mv(`${filePath}/${qrCodeImgName}`)


        await AdminWallet.create({
            crypto: crypto_id,
            crypto_name,
            network,
            address,
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
        const { crypto_name, network, address, wallet_id } = req.body
        if (!wallet_id) return res.json({ status: 404, msg: `Provide Wallet id` })

        const adminWallet = await AdminWallet.findOne({ where: { id: wallet_id } })
        if (!adminWallet) return res.json({ status: 404, msg: 'Wallet not found' })

        const qrcode_img = req?.files?.qrcode_img

        let qrCodeImgName;

        const filePath = './public/adminWallets'
        const currentQrCodeImgPath = `${filePath}/${adminWallet.qrcode_img}`

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

            await qrcode_img.mv(`${filePath}/${qrCodeImgName}`)
        }

        if (qrcode_img) {
            adminWallet.qrcode_img = qrCodeImgName
        }
        if (crypto_name) {
            adminWallet.crypto_name = crypto_name
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

        const QrImgPath = `./public/adminWallets/${adminWallet.qrcode_img}`
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

        const { title, price_start, price_limit, profit_return, plan_bonus, duration, duration_type } = req.body
        if (!title || !price_start || !price_limit || !profit_return || !plan_bonus || !duration || !duration_type) return res.json({ status: 404, msg: `Incomplete request found` })
        const findPlan = await TradingPlans.findOne({ where: { title: title } })
        if (findPlan) return res.json({ status: 404, msg: `${title} already exists` })

        await TradingPlans.create({
            title,
            price_start,
            price_limit,
            profit_return,
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
        const { plan_id, title, price_start, price_limit, profit_return, plan_bonus, duration, duration_type } = req.body
        if (!plan_id) return res.json({ status: 404, msg: `Provide trading plan id` })

        const tradingPlan = await TradingPlans.findOne({ where: { id: plan_id } })
        if (!tradingPlan) return res.json({ status: 404, msg: 'Trading plan not found' })

        const investments = await Investment.findAll({ where: { status: 'running', trading_plan_id: plan_id } })
        if (investments.length > 0) return res.json({ status: 404, msg: 'Ongoing investment(s) on this plan' })

        if (title) {
            tradingPlan.title = title
        }
        if (price_start) {
            tradingPlan.price_start = price_start
        }
        if (price_limit) {
            tradingPlan.price_limit = price_limit
        }
        if (profit_return) {
            tradingPlan.profit_return = profit_return
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
        const { referral_bonus_percentage, tax_percentage, deposit_minimum } = req.body

        const adminStore = await AdminStore.findOne({
        })
        if (!adminStore) return res.json({ status: 400, msg: 'Admin Store not found' })

        if (referral_bonus_percentage) {
            adminStore.referral_bonus_percentage = referral_bonus_percentage
        }
        if (tax_percentage) {
            adminStore.tax_percentage = tax_percentage
        }
        if (deposit_minimum) {
            adminStore.deposit_minimum = deposit_minimum
        }

        await adminStore.save()

        const updated = await AdminStore.findOne({
        })

        return res.json({ status: 200, msg: updated })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}


cron.schedule('* * * * *', async () => {

    const investments = await Investment.findAll({ where: { status: 'running' } })

    investments.map(async ele => {

        const investmentUser = await User.findOne({ where: { id: ele.user } })

        const tradingPlan = await TradingPlans.findOne({ where: { id: ele.trading_plan_id } })

        if (tradingPlan) {
            const TotalProfit = ele.amount * tradingPlan.profit_return / 100
            const TotalBonus = ele.amount * tradingPlan.plan_bonus / tradingPlan.price_limit
            const topupProfit = TotalProfit / tradingPlan.duration
            const topupBonus = TotalBonus / tradingPlan.duration

            if (moment().isSameOrAfter(new Date(ele.topupDuration))) {

                if (ele.rounds < tradingPlan.duration) {

                    ele.profit += parseFloat(topupProfit.toFixed(1))
                    ele.bonus += parseFloat(topupBonus.toFixed(1))

                    const newTopupDuration = moment().add(parseFloat(0.5), `${tradingPlan.duration_type}`)
                    ele.topupDuration = `${newTopupDuration}`

                    ele.rounds += 1

                    if (ele.rounds >= tradingPlan.duration) {
                        ele.status = 'completed'

                        await Notification.create({
                            user: ele.user,
                            title: `profit completed`,
                            content: `Profits for your $${ele.amount} ${ele.trading_plan} plan investment is completed. Check your investment portfolio to claim.`,
                            URL: '/dashboard/investment',
                        })

                        const content = `<div font-size: 1rem;>Hello ${investmentUser.username}, your profits generated for the investment of $${ele.amount} ${ele.trading_plan} plan has been completed, you can now succesfully claim to your wallet.</div> `

                        await sendMail({ subject: 'Profit Completed', to: investmentUser.email, html: content, text: content })
                    }

                    await ele.save()
                }
            }
        }

    })
})
