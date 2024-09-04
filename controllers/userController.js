const slug = require('slug')
const fs = require('fs')
const User = require('../models').users
const Investment = require('../models').investments
const Notification = require('../models').notifications
const Deposit = require('../models').deposits
const Withdrawal = require('../models').withdrawals
const Wallet = require('../models').wallets
const Up = require('../models').ups
const Tax = require('../models').taxes
const Kyc = require('../models').kyc
const AdminStore = require('../models').admin_store
const jwt = require('jsonwebtoken')
const sendMail = require('../config/emailConfig')
const otpGenerator = require('otp-generator')
require('dotenv').config()



exports.CreateAccount = async (req, res) => {
    try {
        const { full_name, username, email, referral_code, country, country_flag, password, confirm_password } = req.body

        if (!full_name) return res.json({ status: 404, msg: `Your full name is required` })
        if (!username) return res.json({ status: 404, msg: `Username is required` })
        if (!email) return res.json({ status: 404, msg: `Email address is required` })
        if (!country) return res.json({ status: 404, msg: `Country is required` })
        if (!country_flag) return res.json({ status: 404, msg: `Country flag is required` })
        if (!password) return res.json({ status: 404, msg: `Password is required` })
        if (password.length < 6) return res.json({ status: 404, msg: `Password must be at least 6 characters` })
        if (!confirm_password) return res.json({ status: 404, msg: `Confirm password is required` })
        if (confirm_password !== password) return res.json({ status: 404, msg: `Passwords mismatch` })

        const findUsername = await User.findOne({ where: { username: username } })
        if (findUsername) return res.json({ status: 400, msg: `Username already exists` })
        const findEmail = await User.findOne({ where: { email: email } })
        if (findEmail) return res.json({ status: 400, msg: `Email already exists` })
        if (referral_code) {
            const findMyReferral = await User.findOne({ where: { referral_id: referral_code } })
            if (!findMyReferral) return res.json({ status: 404, msg: 'Invalid referral code' })
        }

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
            my_referral: referral_code ? referral_code : null
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

        const admins = await User.findAll({ where: { role: 'admin' } })
        if (admins) {
            admins.map(async ele => {
                await Notification.create({
                    user: ele.id,
                    title: `${username} joins AI Algo`,
                    content: `Hello Admin, you have a new user as ${full_name} joins the system.`,
                    URL: '/admin-controls/users',
                })

                const emailcontent = `<div font-size: 1rem;>Hello admin, you have a new user as ${user.full_name} joins the AI Algorithm trading system.</div> `

                await sendMail({ subject: 'New User Alert', to: ele.email, html: emailcontent, text: emailcontent })
            })
        }

        const otp = otpGenerator.generate(6, { specialChars: false })
        const content = `
        <div font-size: 2rem; text-align: center>Copy and paste your account verification code below:</div>
        <div style="color: blue; font-size: 5rem; margin-top: 1rem;">${otp}</div>
        `
        user.resetcode = otp
        await user.save()
        await sendMail({ subject: 'Email Verification Code', to: user.email, html: content, text: content })

        const adminStore = await AdminStore.findOne({
        })
        if (!adminStore) {
            await AdminStore.create({
            })
        }

        return res.json({ status: 200, msg: 'Account created successfully' })
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
        if (!findEmail) return res.json({ status: 400, msg: `No account belongs to the email` })
        if (password !== findEmail.password) return res.json({ status: 404, msg: `Wrong password entered` })

        const findIfSuspended = await User.findOne({ where: { email: email, suspend: 'true' } })
        if (findIfSuspended) return res.json({ status: 400, msg: `Your account has been suspended` })

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
        if (!user) return res.json({ status: 404, msg: `No account belongs to this email` })

        const adminStore = await AdminStore.findOne({
        })
        if (!adminStore) return res.json({ status: 400, msg: 'Admin Store not found' })

        const otp = otpGenerator.generate(6, { specialChars: false })

        const content = `
        <div style="padding-right: 1rem; padding-left: 1rem; margin-top: 2.5rem">
         <img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725460513/myfolder/aoasjh8mldxsezfs9cbe.png' style="width: 4rem; height: auto" />
         <div style="padding-top: 1.2rem; padding-bottom: 1.2rem; border-top: 1px solid lightgrey; margin-top: 1rem">
            <div style="font-size: 1.1rem; font-weight: bold">Your email verification code</div>
            <div style="font-size: 2rem; margin-top: 1rem">${otp}</div>
            <div style="margin-top: 1.5rem">This code can only be used once. If you didn't request a code, please ignore this email. Never share this code with anyone else.</div>
         </div>
         <div style="margin-top: 3rem; padding-top: 1rem; padding-bottom: 1rem; border-top: 1px solid #E96E28;">
             <div style="font-weight: bold; color: #E96E28; text-align: center">Stay connected!</div>
             <div style="display: flex; gap: 16px; align-items: center; justify-content: center; margin-top: 1rem">
                 <a href=${adminStore.facebook}><img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725461777/myfolder/jhjssvvwqe85g7m6ygoj.png' style="width: 1.1rem; height: 1.1rem" /></a>
                 <a href=${adminStore.instagram}><img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725461786/myfolder/kbkwpgdzajsmlidyserp.png' style="width: 1rem; height: 1rem" /></a>
                 <a href=${adminStore.telegram}><img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725461793/myfolder/sea7fie6r1mndax4ent8.png' style="width: 1rem; height: 1rem" /></a>
             </div>
             <div style="margin-top: 1rem; font-size: 0.85rem">If you have any questions or suggestions, please feel free to contact us via our 24/7 online help or email: ${process.env.MAIL_USER}</div>
             <div style="margin-top: 1rem;  width: fit-content; height: fit-content; background-color: #172029; color: #94A3B8; font-size: 0.75rem; padding-right: 3rem; padding-left: 3rem; padding-top: 0.75rem; padding-bottom: 0.75rem; display: flex; gap: 4px; align-items: center">
                  <div> <img src='https://res.cloudinary.com/dnz3cbnxr/image/upload/v1725463522/qjtwmzzj6orqraedef04.png'  style="width: 0.75rem; height: 0.75rem" /></div>
                  <div>AI Algo 2024, All rights reserved</div>.
             </div>
         </div>
        </div>
        `
        user.resetcode = otp
        await user.save()
        await sendMail({ subject: 'Email Verification Code', to: user.email, html: content, text: content })

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
        const { full_name, username, email, old_password, new_password, facebook, instagram, telegram } = req.body

        const user = await User.findOne({ where: { id: req.user } })
        if (!user) return res.json({ status: 404, msg: 'Account not found' })

        if (username) {
            if (username !== user.username) {
                const matchedSomeoneElse = await User.findOne({ where: { username: username } })
                if (matchedSomeoneElse) return res.json({ status: 404, msg: 'Username unavailable' })
            }
        }

        if (email) {
            if (email !== user.email) {
                const matchedSomeoneElse = await User.findOne({ where: { email: email } })
                if (matchedSomeoneElse) return res.json({ status: 404, msg: 'Email entered already exists' })

                if (user.role === 'user') {
                    user.email_verified = 'false'
                }
            }
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
        if (old_password) {

            if (user.password !== old_password) return res.json({ status: 404, msg: 'Enter your correct old password' })
            if (!new_password) return res.json({ status: 404, msg: `Enter a new password` })
        }
        if (new_password) {

            if (!old_password) return res.json({ status: 404, msg: `Enter your old password` })
            if (new_password.length < 6) return res.json({ status: 404, msg: `New Password must be at least six characters` })
            user.password = new_password
        }

        await user.save()

        const adminStore = await AdminStore.findOne({
        })
        if (!adminStore) return res.json({ status: 400, msg: 'Admin Store not found' })

        if (facebook) {
            adminStore.facebook = facebook
        }
        if (instagram) {
            adminStore.instagram = instagram
        }
        if (telegram) {
            adminStore.telegram = telegram
        }

        await adminStore.save()

        return res.json({ status: 200, msg: user, store: adminStore })
    } catch (error) {
        res.json({ status: 400, msg: error.message })
    }
}

exports.ContactFromUsers = async (req, res) => {
    try {
        const { email, message } = req.body
        if (!email) return res.json({ status: 404, msg: `Enter your email account` })
        if (!message) return res.json({ status: 404, msg: `Enter your message` })

        const admins = await User.findAll({ where: { role: 'admin' } })

        const content = `
        <div style="color: #E96E28">From: ${email}</div>
        <div style="margin-top: 1rem; color: #E96E28">Message:</div>
        <div style="margin-top: 0.5rem">${message}</div>
        `
        if (admins) {
            admins.map(async ele => {
                await sendMail({ subject: 'Contact From Ai Algo User', to: ele.email, html: content, text: content })
            })
        }

        return res.json({ status: 200, msg: 'Message successfully delivered' })
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

        if (wallet) {
            await wallet.destroy()
        }

        const ups = await Up.findOne({
            where: { user: req.user },
        })

        if (ups) {
            await ups.destroy()
        }

        const kyc = await Kyc.findOne({
            where: { user: req.user },
        })

        if (kyc) {
            await kyc.destroy()
        }

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

        const taxes = await Tax.findAll({
            where: { user: req.user },
        })

        if (taxes) {
            taxes.map(async ele => {
                await ele.destroy()
            })
        }

        const admins = await User.findAll({ where: { role: 'admin' } })
        if (admins) {
            admins.map(async ele => {
                await Notification.create({
                    user: ele.id,
                    title: `${user.username} leaves AI Algo`,
                    content: `Hello Admin, ${user.full_name} permanently deletes account on the system.`,
                    URL: '/admin-controls/users',
                })

                const emailcontent = `<div font-size: 1rem;>Hello admin, ${user.full_name} leaves the AI Algorithm trading as trader deletes account permanently.</div> `

                await sendMail({ subject: 'User Leaves AI Algo', to: ele.email, html: emailcontent, text: emailcontent })
            })
        }

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
        let userUps = {}
        const ups = await Up.findOne({ where: { user: req.user } })

        if (ups) {
            userUps = ups
        }

        return res.json({ status: 200, msg: userUps })
    } catch (error) {
        res.json({ status: 500, msg: error.message })
    }
}
