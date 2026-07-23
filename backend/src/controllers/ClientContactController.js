const { Client, ClientAddress, ClientContact, AuditLog } = require('../models');
const logger = require('../config/logger');

async function limpiarPrincipalAnterior(model, cliente_id, excluirId) {
  const registros = await model.findAll({ where: { cliente_id, principal: true } });
  await Promise.all(
    registros.filter((r) => r.id !== excluirId).map((r) => r.update({ principal: false }))
  );
}

// ── Direcciones ─────────────────────────────────────────────────────────

exports.createAddress = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { tipo, etiqueta, direccion, ciudad, principal, notas } = req.body;

    const cliente = await Client.findByPk(clientId);
    if (!cliente) {
      return res.status(404).json({ success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' } });
    }
    if (!direccion) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'La dirección es obligatoria' } });
    }

    const nueva = await ClientAddress.create({
      cliente_id: clientId,
      tipo: tipo || 'general',
      etiqueta,
      direccion,
      ciudad,
      principal: !!principal,
      notas,
      creado_por: req.user.id,
    });

    if (nueva.principal) await limpiarPrincipalAnterior(ClientAddress, clientId, nueva.id);

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'client_address',
      entidad_id: nueva.id,
      cambios_nuevos: { cliente_id: clientId, tipo, direccion },
      ip_address: req.ip,
    });

    logger.info(`[CLIENT_ADDRESSES] Dirección agregada al cliente ${cliente.nombre} por ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Dirección agregada', data: nueva });
  } catch (error) {
    logger.error(`[CLIENT_ADDRESSES] Error creando dirección: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_ADDRESS_ERROR', message: 'Error agregando la dirección' } });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const direccionRegistro = await ClientAddress.findByPk(req.params.id);
    if (!direccionRegistro) {
      return res.status(404).json({ success: false, error: { code: 'ADDRESS_NOT_FOUND', message: 'La dirección no existe' } });
    }

    const camposPermitidos = ['tipo', 'etiqueta', 'direccion', 'ciudad', 'principal', 'notas'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== direccionRegistro[campo]) {
        cambiosAnteriores[campo] = direccionRegistro[campo];
        cambiosNuevos[campo] = req.body[campo];
        direccionRegistro[campo] = req.body[campo];
      }
    });

    await direccionRegistro.save();
    if (direccionRegistro.principal) await limpiarPrincipalAnterior(ClientAddress, direccionRegistro.cliente_id, direccionRegistro.id);

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'client_address',
        entidad_id: direccionRegistro.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    res.json({ success: true, message: 'Dirección actualizada', data: direccionRegistro });
  } catch (error) {
    logger.error(`[CLIENT_ADDRESSES] Error actualizando dirección: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_ADDRESS_ERROR', message: 'Error actualizando la dirección' } });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const direccionRegistro = await ClientAddress.findByPk(req.params.id);
    if (!direccionRegistro) {
      return res.status(404).json({ success: false, error: { code: 'ADDRESS_NOT_FOUND', message: 'La dirección no existe' } });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'eliminar',
      entidad: 'client_address',
      entidad_id: direccionRegistro.id,
      cambios_anteriores: { direccion: direccionRegistro.direccion, tipo: direccionRegistro.tipo },
      ip_address: req.ip,
    });

    await direccionRegistro.destroy();
    res.json({ success: true, message: 'Dirección eliminada' });
  } catch (error) {
    logger.error(`[CLIENT_ADDRESSES] Error eliminando dirección: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'DELETE_ADDRESS_ERROR', message: 'Error eliminando la dirección' } });
  }
};

// ── Contactos ───────────────────────────────────────────────────────────

exports.createContact = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { tipo, nombre, cargo, email, telefono, principal, notas } = req.body;

    const cliente = await Client.findByPk(clientId);
    if (!cliente) {
      return res.status(404).json({ success: false, error: { code: 'CLIENT_NOT_FOUND', message: 'El cliente no existe' } });
    }
    if (!email && !telefono) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El contacto debe tener al menos un correo o un teléfono' } });
    }

    const nuevo = await ClientContact.create({
      cliente_id: clientId,
      tipo: tipo || 'general',
      nombre,
      cargo,
      email,
      telefono,
      principal: !!principal,
      notas,
      creado_por: req.user.id,
    });

    if (nuevo.principal) await limpiarPrincipalAnterior(ClientContact, clientId, nuevo.id);

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'client_contact',
      entidad_id: nuevo.id,
      cambios_nuevos: { cliente_id: clientId, tipo, email },
      ip_address: req.ip,
    });

    logger.info(`[CLIENT_CONTACTS] Contacto agregado al cliente ${cliente.nombre} por ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Contacto agregado', data: nuevo });
  } catch (error) {
    logger.error(`[CLIENT_CONTACTS] Error creando contacto: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_CONTACT_ERROR', message: 'Error agregando el contacto' } });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const contacto = await ClientContact.findByPk(req.params.id);
    if (!contacto) {
      return res.status(404).json({ success: false, error: { code: 'CONTACT_NOT_FOUND', message: 'El contacto no existe' } });
    }

    const camposPermitidos = ['tipo', 'nombre', 'cargo', 'email', 'telefono', 'principal', 'notas'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== contacto[campo]) {
        cambiosAnteriores[campo] = contacto[campo];
        cambiosNuevos[campo] = req.body[campo];
        contacto[campo] = req.body[campo];
      }
    });

    if (!contacto.email && !contacto.telefono) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El contacto debe tener al menos un correo o un teléfono' } });
    }

    await contacto.save();
    if (contacto.principal) await limpiarPrincipalAnterior(ClientContact, contacto.cliente_id, contacto.id);

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'client_contact',
        entidad_id: contacto.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    res.json({ success: true, message: 'Contacto actualizado', data: contacto });
  } catch (error) {
    logger.error(`[CLIENT_CONTACTS] Error actualizando contacto: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_CONTACT_ERROR', message: 'Error actualizando el contacto' } });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const contacto = await ClientContact.findByPk(req.params.id);
    if (!contacto) {
      return res.status(404).json({ success: false, error: { code: 'CONTACT_NOT_FOUND', message: 'El contacto no existe' } });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'eliminar',
      entidad: 'client_contact',
      entidad_id: contacto.id,
      cambios_anteriores: { email: contacto.email, tipo: contacto.tipo },
      ip_address: req.ip,
    });

    await contacto.destroy();
    res.json({ success: true, message: 'Contacto eliminado' });
  } catch (error) {
    logger.error(`[CLIENT_CONTACTS] Error eliminando contacto: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'DELETE_CONTACT_ERROR', message: 'Error eliminando el contacto' } });
  }
};
