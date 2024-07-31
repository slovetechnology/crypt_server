const User = require('../models').users
const Investment = require('../models').investments
const Deposit = require('../models').deposits
const Notification = require('../models').notifications
const Withdrawal = require('../models').withdrawals
const Wallet = require('../models').wallets
const AdmimWallet = require('../models').admin_wallets
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
                    as: 'deposituser',
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
        const { user, deposit_status, deposit_id, profit, bonus, profit_status } = req.body

        const deposituser = await User.findOne({ where: { id: user } })
        if (!deposituser) return res.json({ status: 400, msg: 'Deposit User not found' })
        const deposit = await Deposit.findOne({ where: { id: deposit_id } })
        if (!deposit) return res.json({ status: 400, msg: 'Deposit not found' })

        if (deposit.deposit_status !== 'confirmed') {

            if (deposit_status === 'confirmed') {

                await Notification.create({
                    user: user,
                    title: `deposit confirmed`,
                    content: `Your deposit amount of $${deposit.amount} for ${deposit.trading_plan} has been confirmed. Check your investment portfolio as your trading begins now.`,
                    URL: 'investment',
                    URL_state: 0
                })

                const wallet = await Wallet.findOne({ where: { user: user } })
                if (!wallet) return res.json({ status: 404, msg: `User wallet not found` })
                wallet.total_deposit += deposit.amount
                await wallet.save()

                const content = `<div font-size: 1rem;>Hello ${deposituser.username}, your deposit of $${deposit.amount} for ${deposit.trading_plan} has been confirmed, your trading on this investment begins now.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Deposit Confirmation', to: deposituser.email, html: content, text: content })
            }
        }

        if (deposit.profit_status !== 'completed') {
            if (profit_status === 'completed') {

                await Notification.create({
                    user: user,
                    title: `profits completed`,
                    content: `Profits for your $${deposit.amount} ${deposit.trading_plan} investment is completed. Check your investment portfolio to claim.`,
                    URL: 'investment',
                    URL_state: 0
                })

                const content = `<div font-size: 1rem;>Hello ${deposituser.username}, your profits generated for the investment of $${deposit.amount} ${deposit.trading_plan} has been completed, you can now succesfully claim to your wallet.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Profit Completed', to: deposituser.email, html: content, text: content })
            }
        }

        if (deposit.deposit_status !== 'failed') {
            if (deposit_status === 'failed') {

                await Notification.create({
                    user: user,
                    title: `approval failed`,
                    content: `Your deposit amount of $${deposit.amount} for ${deposit.trading_plan} approval failed. This deposit was not confirmed.`,
                    status: 'failed',
                    URL: 'deposit',
                    URL_state: 1
                })
            }
        }

        deposit.deposit_status = deposit_status
        deposit.profit_status = profit_status

        if (profit) {
            deposit.profit += profit
        }

        if (bonus) {
            deposit.bonus += bonus

        }

        await deposit.save()

        const investment = await Investment.findOne({ where: { id: deposit_id } })

        if (!investment) return res.json({ status: 200, msg: `Investment user not found` })

        investment.profit = deposit.profit
        investment.bonus = deposit.bonus
        investment.investment_status = deposit.deposit_status
        investment.profit_status = deposit.profit_status

        await investment.save()


        const alldeposits = await Deposit.findAll({
            include: [
                {
                    model: User,
                    as: 'deposituser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })
        return res.json({ status: 200, msg: alldeposits })

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

        return res.json({ status: 200, msg: users })


    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}


exports.GetUserTotalInvestment = async (req, res) => {

    try {
        const { user_id } = req.body

        const userdeposit = await Deposit.findAll({
            where: { user: user_id, deposit_status: 'confirmed' }
        })

        let amount = 0

        userdeposit.map(item => {
            amount += item.amount

        })

        return res.json({ status: 200, msg: amount })

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
                    as: 'wthuser',
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
                    URL: 'withdraw',
                    URL_state: 1
                })

                const content = `<div font-size: 1rem;>Hello ${withdrawaluser.username}, your withdrawal of $${withdrawal.amount} for wallet address ${withdrawal.wallet_address} has been confirmed.</div> `

                await sendMail({ from: 'support@secureinvest.org', subject: 'Withdrawal Confirmation', to: withdrawaluser.email, html: content, text: content })
            }
        }

        withdrawal.status = status
        await withdrawal.save()

        const allwithdrawals = await Withdrawal.findAll({
            include: [
                {
                    model: User,
                    as: 'wthuser',
                    attributes: {
                        exclude: ['password', 'createdAt', 'updatedAt', 'role']
                    }
                },
            ],

            order: [['createdAt', 'DESC']]
        })

        return res.json({ status: 200, msg: allwithdrawals })

    } catch (error) {
        return res.json({ status: 200, msg: error.message })
    }
}


exports.CreateAdminWallets = async (req, res) => {
    try {

        const { coin, network, address, } = req.body
        if (!coin || !network || !address) return res.json({ status: 404, msg: `Incomplete request found` })
        const findCoin = await AdmimWallet.findOne({ where: { coin: coin } })
        if (findCoin) return res.json({ status: 404, msg: `${coin} wallet already found` })

        if (!req.files) return res.json({ status: 404, msg: `Coin image and Qr scan code image are required` })

        const coin_img = req.files.coin_img
        const qrcode_img = req.files.qrcode_img

        const filePath = './public/coins'
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath)
        }

        const coinImgName = `${slug(coin, '-')}.jpg`
        const qrCodeImgName = `${slug(network, '-')}.jpg`

        await qrcode_img.mv(`${filePath}/${qrCodeImgName}`)
        await coin_img.mv(`${filePath}/${coinImgName}`)


        await AdmimWallet.create({
            coin,
            network,
            address,
            coin_img: coinImgName,
            qrcode_img: qrCodeImgName,
        })

        const AllWallet = await AdmimWallet.findAll({
        })


        return res.json({ status: 200, msg: AllWallet})
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.GetAdminWallets = async (req, res) => {
    try {
        const adminWallets = await AdmimWallet.findAll({
        })

        return res.json({ status: 200, msg: adminWallets })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}


exports.UpdateAdminWallet = async (req, res) => {
    try {
        const { coin, network, address, wallet_id } = req.body
        if (!wallet_id) return res.json({ status: 404, msg: `Provide your Wallet id` })

        const adminWallet = await AdmimWallet.findOne({ where: { id: wallet_id } })
        if (!adminWallet) return res.json({ status: 404, msg: 'Wallet not found' })

        const coin_img = req?.files?.coin_img
        const qrcode_img = req?.files?.qrcode_img

        let coinImgName;
        let qrCodeImgName;

        const filePath = './public/coins'
        const currentCoinImgPath = `${filePath}/${adminWallet.coin_img}`
        const currentQrCodeImgPath = `${filePath}/${adminWallet.qrcode_img}`

        if (coin_img) {

            if (fs.existsSync(currentCoinImgPath)) {
                fs.unlinkSync(currentCoinImgPath)
            }

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath)
            }

            if (coin) {
                coinImgName = `${slug(coin, '-')}.jpg`
            } else {
                coinImgName = `${slug(adminWallet.coin, '-')}.jpg`
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

        if (coin_img) {
            await coin_img.mv(`${filePath}/${coinImgName}`)
        }

        if (qrcode_img) {
            await qrcode_img.mv(`${filePath}/${qrCodeImgName}`)
        }


        if (coin_img) {
            adminWallet.coin_img = coinImgName
        }
        if (qrcode_img) {
            adminWallet.qrcode_img = qrCodeImgName
        }
        if (coin) {
            adminWallet.coin = coin
        }
        if (network) {
            adminWallet.network = network
        }
        if (address) {
            adminWallet.address = address
        }


        await adminWallet.save()

        const AllWallet = await AdmimWallet.findAll({
        })


        return res.json({ status: 200, msg: AllWallet })
    } catch (error) {
        res.json({ status: 400, msg: error.message })
    }
}


exports.DeleteWallet = async (req, res) => {
    try {
        const { wallet_id } = req.body

        if (!wallet_id) return res.json({ status: 404, msg: `Provide your Wallet id` })

        const adminWallet = await AdmimWallet.findOne({ where: { id: wallet_id } })
        if (!adminWallet) return res.json({ status: 404, msg: 'Wallet not found' })


        const CoinImgPath = `./public/coins/${adminWallet.coin_img}`
        if (fs.existsSync(CoinImgPath)) {
            fs.unlinkSync(CoinImgPath)
        }

        const QrImgPath = `./public/coins/${adminWallet.qrcode_img}`
        if (fs.existsSync(QrImgPath)) {
            fs.unlinkSync(QrImgPath)
        }


        await adminWallet.destroy()

        const AllWallet = await AdmimWallet.findAll({
        })

        return res.json({ status: 200, msg: AllWallet })

    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}