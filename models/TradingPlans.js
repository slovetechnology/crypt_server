module.exports = (sequelize, DataTypes) => {
    return sequelize.define('trading_Plans', {
        title: { type: DataTypes.STRING },
        price_start: { type: DataTypes.FLOAT },
        price_limit: { type: DataTypes.FLOAT },
        profit_return: { type: DataTypes.FLOAT },
        plan_bonus: { type: DataTypes.FLOAT },
        duration: { type: DataTypes.FLOAT },
        duration_type: { type: DataTypes.STRING },
    })
}