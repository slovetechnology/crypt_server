module.exports = (sequelize, DataTypes) => {
    return sequelize.define('adminStore', {
        referral_bonus: {type: DataTypes.FLOAT, defaultValue: 0},
        withdrawal_minimum: {type: DataTypes.FLOAT, defaultValue: 0},
        profit_percentage: {type: DataTypes.FLOAT, defaultValue: 0},
        investment_duration: {type: DataTypes.INTEGER, defaultValue: 0},
        tax_percentage: {type: DataTypes.FLOAT, defaultValue: 0},
    })
}