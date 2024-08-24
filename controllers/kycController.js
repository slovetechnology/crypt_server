const sendMail = require('../config/emailConfig')
const Notification = require('../models').notifications
const User = require('../models').users
const Kyc = require('../models').kyc
const fs = require('fs')
const slug = require('slug')



exports.UserkYC = async (req, res) => {
    try {
        const kyc = await Kyc.findOne({ where: { user: req.user } })
        if (!kyc) return res.json({ status: 400, msg: 'User kyc not found' })

        return res.json({ status: 200, msg: kyc })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}

exports.Create_Update_Kyc = async (req, res) => {
    try {
        const { first_name, last_name, gender, marital_status, country, country_flag, date_of_birth, address, state, postal, phone_code, phone_number, ssn, kycUser } = req.body
        if (!first_name || !last_name || !gender || !marital_status || !country || !country_flag || !date_of_birth || !address || !state || !postal || !phone_code || !phone_number || !ssn || !kycUser) return res.json({ status: 404, msg: `Incomplete request found` })

        const filePath = './public/identity'
        const date = new Date()
        let imageName;


        const kyc = await Kyc.findOne({ where: { user: req.user } })
        if (!kyc) {

            if (!req.files) return res.json({ status: 404, msg: `Attach a valid ID` })
            const image = req.files.valid_id

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath)
            }

            imageName = `${date.getTime()}.jpg`
            await image.mv(`${filePath}/${imageName}`)

            await Kyc.create({
                user: req.user,
                valid_id: imageName,
                first_name,
                last_name,
                gender,
                marital_status,
                country,
                country_flag,
                date_of_birth,
                address,
                state,
                postal,
                phone_code,
                phone_number,
                ssn
            })

            await Notification.create({
                user: req.user,
                title: `KYC submitted`,
                content: `Your kyc details have been submitted successfully and processing for verification.`,
                URL: '/dashboard/verify-account/kyc',
            })

            const admins = await User.findAll({ where: { role: 'admin' } })
            if (admins) {
                admins.map(async ele => {
                    await Notification.create({
                        user: ele.id,
                        title: `KYC submission alert`,
                        content: `Hello Admin, ${kycUser} just submitted KYC details, verify authenticity.`,
                        role: 'admin',
                        URL: '/admin-controls/users',
                    })

                    const content = `<div font-size: 1rem;>Admin, ${kycUser} just submitted KYC details, verify authenticity.</div> `

                    await sendMail({ subject: 'KYC Submission Alert', to: ele.email, html: content, text: content })
                })
            }
        } else {

            const image = req?.files?.valid_id

            if (image) {
                const currentImagePath = `${filePath}/${kyc.valid_id}`
                if (fs.existsSync(currentImagePath)) {
                    fs.unlinkSync(currentImagePath)
                }

                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                }

                imageName = `${date.getTime()}.jpg`
                await image.mv(`${filePath}/${imageName}`)
            }

            if (image) {
                kyc.valid_id = imageName
            }
            kyc.first_name = first_name
            kyc.last_name = last_name
            kyc.gender = gender
            kyc.marital_status = marital_status
            kyc.country = country
            kyc.country_flag = country_flag,
                kyc.postal = postal
            kyc.phone_code = phone_code
            kyc.phone_number = phone_number
            kyc.state = state
            kyc.address = address
            kyc.ssn = ssn
            kyc.date_of_birth = date_of_birth
            kyc.status = 'processing'

            await kyc.save()

            const TheUser = await User.findOne({ where: { id: req.user } })
            TheUser.kyc_verified = 'false'
            await TheUser.save()

            await Notification.create({
                user: req.user,
                title: `KYC re-uploaded`,
                content: `Your kyc details have been re-uploaded successfully and processing for verification.`,
                URL: '/dashboard/verify-account/kyc',
            })

            const admins = await User.findAll({ where: { role: 'admin' } })
            if (admins) {
                admins.map(async ele => {
                    await Notification.create({
                        user: ele.id,
                        title: `KYC re-upload alert`,
                        content: `Hello Admin, ${kycUser} just re-uploaded KYC details, verify authenticity.`,
                        role: 'admin',
                        URL: '/admin-controls/users',
                    })

                    const content = `<div font-size: 1rem;>Admin, ${kycUser} just re-uploaded KYC details, verify authenticity.</div> `

                    await sendMail({ subject: 'KYC Re-Upload Alert', to: ele.email, html: content, text: content })
                })
            }
        }

        const user = await User.findByPk(req.user)

        const notifications = await Notification.findAll({
            where: { user: req.user },
            order: [['createdAt', 'DESC']],
        })

        const unreadnotis = await Notification.findAll({
            where: { user: req.user, read: 'false' },
        })

        return res.json({ status: 200, msg: 'Details submitted', profile: user, notis: notifications, unread: unreadnotis })
    } catch (error) {
        return res.json({ status: 400, msg: error.message })
    }
}