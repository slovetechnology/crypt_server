const slug = require('slug')
const fs = require('fs')
const User = require('../models').users
const Investment = require('../models').investments
const Notification = require('../models').notifications
const Deposit = require('../models').deposits
const Withdrawal = require('../models').withdrawals
const Wallet = require('../models').wallets
const Up = require('../models').ups
const jwt = require('jsonwebtoken')
const sendMail = require('../config/emailConfig')
const otpGenerator = require('otp-generator')

exports.CreateAccount = async (req, res) => {
    try {
        const { full_name, username, email, referral_id, country, country_flag, password, confirm_password } = req.body

        if (!full_name) return res.json({ status: 404, msg: `Your full name is required` })
        if (!username) return res.json({ status: 404, msg: `Username is required` })
        if (!email) return res.json({ status: 404, msg: `Email address is required` })
        if (!country) return res.json({ status: 404, msg: `Country flag is required` })
        if (!country_flag) return res.json({ status: 404, msg: `Trader's code is required` })
        if (password.length < 6) return res.json({ status: 404, msg: `Password must be at least 6 characters` })
        if (!confirm_password) return res.json({ status: 404, msg: `Confirm password is required` })
        if (confirm_password !== password) return res.json({ status: 404, msg: `Passwords mismatch` })

        const findUsername = await User.findOne({ where: { username: username } })
        if (findUsername) return res.json({ status: 400, msg: `Username already exists` })
        const findEmail = await User.findOne({ where: { email: email } })
        if (findEmail) return res.json({ status: 400, msg: `Email already exists` })

        const imageData = req?.files?.image

        const filePath = './public/profiles'
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath)
        }

        let imageName;
        if (imageData) {
            imageName = `${slug(username, '-')}.jpg`
        }
        if (imageData) {
            await imageData.mv(`${filePath}/${imageName}`)
        }

        const myReferralId = 'AI_' + otpGenerator.generate(8, { specialChars: false })
        const user = await User.create({
            image: imageName,
            country_flag,
            full_name,
            username,
            email,
            country,
            referral_id: myReferralId,
            password,
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

        const admin = await User.findOne({ where: { role: 'admin' } })
        if (admin) {
            await Notification.create({
                user: admin.id,
                title: `${username} joins AI Algo`,
                content: `Hello Admin, you have a new user as ${full_name} joins the system.`,
                role: 'admin',
                URL: '/admin-controls/users',
            })
        }

        const emailcontent = `<div font-size: 1rem;>Hello admin, you have a new user as ${user.full_name} joins the AI Algorithm trading system.</div> `

        if (admin) {
            await sendMail({ from: 'support@secureinvest.org', subject: 'New User Alert', to: admin.email, html: emailcontent, text: emailcontent })
        }

        const otp = otpGenerator.generate(6, { specialChars: false })
        const content = `
        <div font-size: 2rem; text-align: center>Copy and paste your account verification code below:</div>
        <div style="color: blue; font-size: 5rem; margin-top: 1rem;">${otp}</div>
        `
        user.resetcode = otp
        await user.save()
        await sendMail({ from: 'support@secureinvest.org', subject: 'Email Verification Code', to: user.email, html: content, text: content })

        if (referral_id) {
            const findMyReferral = await User.findOne({ where: { referral_id: referral_id } })
            if (!findMyReferral) return res.json({ status: 404, msg: 'User not found' })
            if (findMyReferral.role === 'user') {
                const wallet = await Wallet.findOne({ where: { user: findMyReferral.id } })
                if (!wallet) return res.json({ status: 404, msg: 'User wallet not found' })

                wallet.referral += 100
                wallet.balance += 100
                await wallet.save()

                await Notification.create({
                    user: findMyReferral.id,
                    title: `referral bonus`,
                    content: `Your account has been credited with $${100} from a referral.`,
                    URL: '/dashboard',
                })
            }
        }

        return res.json({ status: 201, msg: `Account created successfully` })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.ResendOtpVerification = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.json({ status: 404, msg: 'Enter a valid email address' })
        const findAccount = await User.findOne({ where: { email: email } })
        if (!findAccount) return res.json({ status: 404, msg: `Account does not exists with us` })
        const otp = otpGenerator.generate(6, { specialChars: false })
        const content = `
        <div font-size: 2rem;>Copy and paste your account verification code below:</div>
        <div style="color: blue; font-size: 5rem; margin-top: 1rem;">${otp}</div>
        `
        findAccount.resetcode = otp
        await findAccount.save()
        await sendMail({ from: 'support@secureinvest.org', subject: 'Resend: Email Verification Code', to: findAccount.email, html: content, text: content })

        return res.json({ status: 200, msg: 'otp code resent' })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.ValidateOtp = async (req, res) => {
    try {
        const { email, code } = req.body
        if (!email || !code) return res.json({ status: 404, msg: 'Incomplete request found' })
        const findAccount = await User.findOne({ where: { email: email } })
        if (!findAccount) return res.json({ status: 404, msg: `Account does not exists with us` })

        if (code !== findAccount.resetcode) return res.json({ status: 404, msg: 'Invalid code entered' })
        findAccount.resetcode = null
        findAccount.email_verified = 'true'
        await findAccount.save()


        const token = jwt.sign({ id: findAccount.id, role: findAccount.role }, process.env.JWT_SECRET, { expiresIn: '3h' })

        const content = `<div font-size: 1rem;>Hello ${findAccount.full_name}, welcome to the AI Algo trading system where we focus on making cryptocurrency trading easy for everyone, get started by making your first deposit.</div> `

        await sendMail({ from: 'support@secureinvest.org', subject: 'Welcome to AI Algo', to: findAccount.email, html: content, text: content })


        return res.json({ status: 200, msg: findAccount, token })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.LoginAccount = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) return res.json({ status: 404, msg: `Incomplete request` })

        const findEmail = await User.findOne({ where: { email: email } })
        if (!findEmail) return res.json({ status: 400, msg: `No account belongs to the email ` })

        if (password !== findEmail.password) return res.json({ status: 404, msg: `Wrong password detected` })

        const token = jwt.sign({ id: findEmail.id, role: findEmail.role }, process.env.JWT_SECRET, { expiresIn: '3h' })

        return res.json({ status: 200, msg: `Login successful`, token })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.FindAccountByEmail = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ where: { email: email } })
        if (!user) return res.json({ status: 404, msg: `This email doesn't exists with us` })
        const otp = otpGenerator.generate(6, { specialChars: false })
        const content = `
        <div font-size: 2rem;>Copy and paste your account verification code below:</div>
        <div style="color: blue; font-size: 5rem; margin-top: 1rem;">${otp}</div>
        `
        user.resetcode = otp
        await user.save()
        await sendMail({ from: 'support@secureinvest.org', subject: 'Email Verification Code', to: user.email, html: content, text: content })

        return res.json({ status: 200 })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}
exports.VerifyOtpForPassword = async (req, res) => {
    try {
        const { email, code } = req.body
        if (!email || !code) return res.json({ status: 404, msg: 'Incomplete request found' })
        const findAccount = await User.findOne({ where: { email: email } })
        if (!findAccount) return res.json({ status: 404, msg: `Account does not exists with us` })
        if (code !== findAccount.resetcode) return res.json({ status: 404, msg: 'Invalid code entered' })
        findAccount.resetcode = null
        await findAccount.save()

        return res.json({ status: 200 })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.ChangePasswordOnRequest = async (req, res) => {
    try {
        const { email, password, confirm_password } = req.body
        if (!email || !password || !confirm_password) return res.json({ status: 404, msg: 'Incomplete request found' })
        if (confirm_password !== password) return res.json({ status: 400, msg: 'Password(s) do not match' })
        const findAccount = await User.findOne({ where: { email: email } })
        if (!findAccount) return res.json({ status: 404, msg: `Account does not exists with us` })
        findAccount.password = password
        await findAccount.save()

        return res.json({ status: 200, msg: 'Password changed successfully' })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.GetProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user)
        if (!user) return res.json({ status: 404, msg: `Account not found` })
        return res.json({ status: 200, msg: user })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}

exports.UpdateProfile = async (req, res) => {
    try {
        const { full_name, username, email, old_password, new_password, user_id } = req.body
        if (!user_id) return res.json({ status: 404, msg: `Provide your account id` })

        const user = await User.findOne({ where: { id: user_id } })
        if (!user) return res.json({ status: 404, msg: 'Account not found' })

        if (old_password) {
            const userPassword = await User.findOne({ where: { password: old_password } })
            if (!userPassword) return res.json({ status: 404, msg: 'Enter your correct old password' })
        }

        if (username !== user.username) {
            const matchedSomeoneElse = await User.findOne({ where: { username: username } })
            if (matchedSomeoneElse) return res.json({ status: 404, msg: 'Username unavailable' })
        }

        if (email !== user.email) {
            const matchedSomeoneElse = await User.findOne({ where: { email: email } })
            if (matchedSomeoneElse) return res.json({ status: 404, msg: 'New email entered already exist' })
            user.email_verified = 'false'
        }

        const image = req?.files?.image
        let imageName;
        const filePath = './public/profiles'
        const currentImagePath = `${filePath}/${user.image}`

        if (image) {

            if (fs.existsSync(currentImagePath)) {
                fs.unlinkSync(currentImagePath)
            }


            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath)
            }

            if (username) {
                imageName = `${slug(username, '-')}.jpg`
            } else {
                imageName = `${slug(user.username, '-')}.jpg`
            }
        }

        if (image) {
            await image.mv(`${filePath}/${imageName}`)
        }

        if (image) {
            user.image = imageName
        }
        if (full_name) {
            user.full_name = full_name
        }
        if (username) {
            user.username = username
        }
        if (email) {
            user.email = email
        }
        if (new_password) {
            if (new_password.length < 6) return res.json({ status: 404, msg: `New Password must be at least six characters` })
            user.password = new_password
        }

        await user.save()

        return res.json({ status: 200, msg: user })
    } catch (error) {
        res.json({ status: 400, msg: error.message })
    }
}

exports.ContactFromUsers = async (req, res) => {
    try {
        const { email, message } = req.body
        if (!email) return res.json({ status: 404, msg: `Enter your email account` })
        if (!message) return res.json({ status: 404, msg: `Enter your message` })

        const content = `
        <div style="color: #E96E28">From: ${email}</div>
        <div style="margin-top: 1rem; color: #E96E28">Message:</div>
        <div style="margin-top: 0.5rem">${message}</div>
        `
        await sendMail({ from: 'support@secureinvest.org', subject: 'Contact From AiAlgo Users', to: 'palmergid@gmail.com', html: content, text: content })

        return res.json({ status: 200, msg: 'Your message has been successfullly delivered' })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.DeleteAcount = async (req, res) => {
    try {

        const { password } = req.body
        if (!password) return res.json({ status: 404, msg: `password is required` })

        const user = await User.findOne({ where: { id: req.user } })
        if (!user) return res.json({ status: 404, msg: 'Account not found' })
        if (password !== user.password) return res.json({ status: 404, msg: `invalid password` })


        const imagePath = `./public/profiles/${user.image}`
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
        }

        const wallet = await Wallet.findOne({
            where: { user: req.user }
        })

        const ups = await Up.findOne({
            where: { user: req.user },
        })

        const deposits = await Deposit.findAll({
            where: { user: req.user },
        })

        if (deposits) {
            deposits.map(async ele => {
                await ele.destroy()
            })
        }

        const investment = await Investment.findAll({
            where: { user: req.user }
        })

        if (investment) {
            investment.map(async ele => {
                await ele.destroy()
            })
        }

        const notifications = await Notification.findAll({
            where: { user: req.user },
        })

        if (notifications) {
            notifications.map(async ele => {
                await ele.destroy()
            })
        }

        const withdrawals = await Withdrawal.findAll({
            where: { user: req.user },
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

        const admin = await User.findOne({ where: { role: 'admin' } })
        await Notification.create({
            user: admin.id,
            title: `${user.username} leaves AI Algo`,
            content: `Hello Admin, ${user.full_name} permanently deletes account on the system.`,
            role: 'admin',
            URL: '/admin-controls/users',
        })

        const emailcontent = `<div font-size: 1rem;>Hello admin, ${user.full_name} leaves the AI Algorithm trading as trader deletes account permanently.</div> `

        await sendMail({ from: 'support@secureinvest.org', subject: 'User Leaves AI Algo', to: admin.email, html: emailcontent, text: emailcontent })

        await user.destroy()

        return res.json({ status: 200, msg: 'Account deleted successfully' })

    } catch (error) {
        return res.json({ status: 500, msg: error.message })
    }
}

exports.UserWallet = async (req, res) => {
    try {
        const wallet = await Wallet.findOne({ where: { user: req.user } })
        if (!wallet) return res.json({ status: 400, msg: 'User wallet not found' })

        return res.json({ status: 200, msg: wallet })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.UserUp = async (req, res) => {
    try {
        const ups = await Up.findOne({ where: { user: req.user } })
        if (!ups) return res.json({ status: 404, msg: `User ups not found` })

        return res.json({ status: 200, msg: ups })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}
