'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Create roles
      const roles = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: 'administrador',
          descripcion: 'Administrador del sistema con acceso total',
          permisos: JSON.stringify(['*']),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nombre: 'jefe_laboratorio',
          descripcion: 'Jefe del laboratorio - Aprueba documentos y supervisa calidad',
          permisos: JSON.stringify([
            'documents:create',
            'documents:read',
            'documents:update',
            'documents:publish',
            'quality:read',
            'audit:read',
            'users:read',
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          nombre: 'supervisor',
          descripcion: 'Supervisor - Gestiona documentos y registra calidad',
          permisos: JSON.stringify([
            'documents:create',
            'documents:read',
            'documents:update',
            'quality:create',
            'quality:read',
            'audit:read',
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          nombre: 'personal_calidad',
          descripcion: 'Personal de Calidad - Registra indicadores de calidad',
          permisos: JSON.stringify([
            'documents:read',
            'quality:create',
            'quality:read',
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await queryInterface.bulkInsert('Roles', roles, { transaction });

      // 2. Create default admin user
      const saltRounds = 10;
      const defaultPassword = 'Admin@123';
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

      const adminUser = [
        {
          id: '550e8400-e29b-41d4-a716-446655440100',
          email: 'admin@laboratorio.com',
          nombre: 'Admin',
          apellido: 'Sistema',
          password: hashedPassword,
          roleId: '550e8400-e29b-41d4-a716-446655440001',
          estado: 'activo',
          ultimo_acceso: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await queryInterface.bulkInsert('Users', adminUser, { transaction });

      // 3. Create sample additional users for testing
      const testUsers = [
        {
          id: '550e8400-e29b-41d4-a716-446655440101',
          email: 'jefe@laboratorio.com',
          nombre: 'Juan',
          apellido: 'Pérez',
          password: await bcrypt.hash('Jefe@123', saltRounds),
          roleId: '550e8400-e29b-41d4-a716-446655440002',
          estado: 'activo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440102',
          email: 'supervisor@laboratorio.com',
          nombre: 'María',
          apellido: 'García',
          password: await bcrypt.hash('Super@123', saltRounds),
          roleId: '550e8400-e29b-41d4-a716-446655440003',
          estado: 'activo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440103',
          email: 'calidad@laboratorio.com',
          nombre: 'Carlos',
          apellido: 'López',
          password: await bcrypt.hash('Calidad@123', saltRounds),
          roleId: '550e8400-e29b-41d4-a716-446655440004',
          estado: 'activo',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await queryInterface.bulkInsert('Users', testUsers, { transaction });

      await transaction.commit();
      console.log('✓ Seeders ejecutados correctamente');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Error en seeders:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Delete in reverse order (foreign key constraints)
      await queryInterface.bulkDelete('Users', {}, { transaction });
      await queryInterface.bulkDelete('Roles', {}, { transaction });

      await transaction.commit();
      console.log('✓ Seeders revertidos correctamente');
    } catch (error) {
      await transaction.rollback();
      console.error('✗ Error revirtiendo seeders:', error);
      throw error;
    }
  },
};
