module.exports = (sequelize, DataTypes) => {
    return sequelize.define('adminWallets', {
        crypto: {type: DataTypes.STRING},
        network: {type: DataTypes.STRING},
        address: {type: DataTypes.STRING},
        crypto_img: {type: DataTypes.STRING, allowNull: false},
        qrcode_img: {type: DataTypes.STRING, allowNull: false},
    })
}