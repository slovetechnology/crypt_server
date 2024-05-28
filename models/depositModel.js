module.exports = (sequelize, DataTypes) => {
    return sequelize.define('deposit', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        trading_plan: {type: DataTypes.STRING},
        crypto: {type: DataTypes.STRING},
        deposit_status: {type: DataTypes.STRING, defaultValue: 'pending'},
        profit: {type: DataTypes.FLOAT, defaultValue: 0},
        bonus: {type: DataTypes.FLOAT, defaultValue: 0},
        profit_status: {type: DataTypes.STRING, defaultValue: 'running'},
        from: {type: DataTypes.STRING}
    })
}