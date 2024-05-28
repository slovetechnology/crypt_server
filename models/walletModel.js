module.exports = (sequelize, DataTypes) => {
    return sequelize.define('wallet', {
        user: {type: DataTypes.INTEGER},
        total_deposit: {type: DataTypes.FLOAT, defaultValue: 0, allowNull: true},
        total_profit: {type: DataTypes.FLOAT, defaultValue: 0, allowNull: true},      
        total_bonus: {type: DataTypes.FLOAT, defaultValue: 0, allowNull: true},
        total_withdrawal: {type: DataTypes.FLOAT, defaultValue: 0, allowNull: true},
        balance: {type: DataTypes.FLOAT, defaultValue: 0, allowNull: true},
    })
}