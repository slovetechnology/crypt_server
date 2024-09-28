module.exports = (sequelize, DataTypes) => {
    return sequelize.define('investment', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        trading_plan: {type: DataTypes.STRING},
        plan_id: {type: DataTypes.INTEGER},
        profit: {type: DataTypes.FLOAT, defaultValue: 0},
        bonus: {type: DataTypes.FLOAT, defaultValue: 0},
        status: {type: DataTypes.STRING, defaultValue: 'running'},
        claim: {type: DataTypes.STRING, defaultValue: 'false'},
        rounds: {type: DataTypes.INTEGER, defaultValue: 0},
        endDate: {type: DataTypes.STRING},
        topupTime: {type: DataTypes.STRING},
    })
}