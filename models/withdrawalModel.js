module.exports = (sequelize, DataTypes) => {
    return sequelize.define('withdrawal', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        crypto: {type: DataTypes.STRING},
        network: {type: DataTypes.STRING},
        withdrawal_address: {type: DataTypes.STRING},
        status: {type: DataTypes.STRING, defaultValue: 'processing'},
    })
}