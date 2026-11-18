const { contactModel } = require("../Models");

async function submitContact(req, res) {
  const created = await contactModel.createMessage({
    ...req.validatedContact,
    ipAddress: req.ip || req.socket?.remoteAddress || null,
  });

  res.status(201).json({
    success: true,
    data: {
      id: created.id,
      status: created.status,
      createdAt: created.createdAt,
      message:
        "Recibimos tu consulta en nuestro laboratorio. Un barista o coordinador te responderá a la brevedad.",
    },
  });
}

module.exports = { submitContact };
