module.exports = (sequelize, DataTypes) => {
    return sequelize.define('adminStore', {
        referral_bonus_percentage: { type: DataTypes.FLOAT, defaultValue: 20 },
        tax_percentage: { type: DataTypes.FLOAT, defaultValue: 30 },
        deposit_minimum: { type: DataTypes.FLOAT, defaultValue: 50 },
        facebook: { type: DataTypes.STRING, defaultValue: 'https://' },
        instagram: { type: DataTypes.STRING, defaultValue: 'https://' },
        telegram: { type: DataTypes.STRING, defaultValue: 'https://' },
    })
}