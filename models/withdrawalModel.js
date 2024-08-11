module.exports = (sequelize, DataTypes) => {
    return sequelize.define('withdrawal', {
        user: {type: DataTypes.INTEGER},
        amount: {type: DataTypes.FLOAT},
        wallet_address: {type: DataTypes.STRING},
        crypto: {type: DataTypes.STRING},
        network: {type: DataTypes.STRING},
        status: {type: DataTypes.STRING, defaultValue: 'processing'},
    })
}