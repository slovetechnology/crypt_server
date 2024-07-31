module.exports = (sequelize, DataTypes) => {
    return sequelize.define('adminWallets', {
        coin: {type: DataTypes.STRING},
        network: {type: DataTypes.STRING},
        address: {type: DataTypes.STRING},
        coin_img: {type: DataTypes.STRING, allowNull: false},
        qrcode_img: {type: DataTypes.STRING, allowNull: false},
    })
}