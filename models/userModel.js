module.exports = (sequelize, DataTypes) => {
    return sequelize.define('user', {
        image: { type: DataTypes.STRING, allowNull: true },
        country_flag: { type: DataTypes.STRING },
        full_name: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING },
        role: { type: DataTypes.STRING, defaultValue: 'user' },
        email: { type: DataTypes.STRING },
        country: { type: DataTypes.STRING },
        referral_id: { type: DataTypes.STRING},
        email_verified: { type: DataTypes.STRING, defaultValue: 'false' },
        kyc_verified: { type: DataTypes.STRING, defaultValue: 'false' },
        resetcode: { type: DataTypes.STRING, allowNull: true },
        password: { type: DataTypes.STRING },
        withdrawal_minimum: { type: DataTypes.FLOAT, defaultValue: 100 },
        suspend: { type: DataTypes.STRING, defaultValue: 'false' },
        my_referral: { type: DataTypes.STRING, allowNull: true}
    })
}