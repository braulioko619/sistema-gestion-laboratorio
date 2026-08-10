module.exports = (sequelize, DataTypes) => {
  const EquipmentImage = sequelize.define('EquipmentImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nombre_original: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_almacenado: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    tipo_mime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tamano_bytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    es_principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    subido_por: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'equipment_images',
    timestamps: true,
  });

  EquipmentImage.associate = (models) => {
    EquipmentImage.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipo',
    });
    EquipmentImage.belongsTo(models.User, {
      foreignKey: 'subido_por',
      as: 'usuario',
    });
  };

  return EquipmentImage;
};
