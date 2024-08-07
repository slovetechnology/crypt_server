module.exports = (sequelize, DataTypes) => {
    return sequelize.define('trading_Plans', {
        title: {type: DataTypes.STRING},
        price_start: {type: DataTypes.FLOAT},
        price_limit: {type: DataTypes.FLOAT},
        plan_bonus: {type: DataTypes.FLOAT},
    })
}