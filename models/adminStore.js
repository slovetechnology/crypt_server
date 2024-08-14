module.exports = (sequelize, DataTypes) => {
    return sequelize.define('adminStore', {
        referral_bonus: {type: DataTypes.FLOAT, defaultValue: 100},
        tax_percentage: {type: DataTypes.FLOAT, defaultValue: 30},
    })
}