module.exports = (sequelize, DataTypes) => {
    return sequelize.define('crypto', {
        crypto_img: {type: DataTypes.STRING},
        crypto_name: {type: DataTypes.STRING},
    })
}