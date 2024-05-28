module.exports = (sequelize, DataTypes) => {
    return sequelize.define('investment', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        trading_plan: {type: DataTypes.STRING},
        crypto: {type: DataTypes.STRING},
        profit: {type: DataTypes.FLOAT, defaultValue: 0},
        bonus: {type: DataTypes.FLOAT, defaultValue: 0},
        investment_status: {type: DataTypes.STRING, defaultValue: 'pending'},
        profit_status: {type: DataTypes.STRING, defaultValue: 'running'},
        claim: {type: DataTypes.STRING, defaultValue: 'false'}
        
    })
}