module.exports = (sequelize, DataTypes) => {
    return sequelize.define('up', {
        user: {type: DataTypes.INTEGER},
        new_profit: {type: DataTypes.FLOAT},
        new_bonus: {type: DataTypes.FLOAT},
    })
}