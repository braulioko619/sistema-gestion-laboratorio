'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        nombre: 'administrador',
        descripcion: 'Administrador del sistema con acceso total',
        permisos: [
          'crear_usuario',
          'editar_usuario',
          'eliminar_usuario',
          'crear_documento',
          'editar_documento',
          'publicar_documento',
          'crear_indicador',
          'ver_auditoria',
          'configurar_sistema',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        nombre: 'jefe_laboratorio',
        descripcion: 'Jefe del laboratorio con permisos de aprobación',
        permisos: [
          'crear_documento',
          'editar_documento',
          'publicar_documento',
          'aprobar_documento',
          'crear_indicador',
          'ver_auditoria',
          'ver_usuario',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        nombre: 'supervisor',
        descripcion: 'Supervisor con permisos de revisión y reporte',
        permisos: [
          'crear_documento',
          'editar_documento',
          'revisar_documento',
          'crear_indicador',
          'ver_auditoria',
          'generar_reporte',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        nombre: 'personal_calidad',
        descripcion: 'Personal de calidad para registro de indicadores',
        permisos: [
          'crear_indicador',
          'editar_indicador',
          'ver_documento',
          'generar_reporte',
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        nombre: 'usuario_lectura',
        descripcion: 'Usuario con permisos de solo lectura',
        permisos: ['ver_documento', 'ver_indicador', 'generar_reporte'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await queryInterface.bulkInsert('roles', roles);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
