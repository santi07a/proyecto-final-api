const Usuario = require("../db/modelos/usuario");
const { generaError } = require("../errores/errores");
const { InformeRespuesta, estructuraJsonResponse } = require("./utils/respuesta");
const transport = require("./utils/transportMail");

const getUsuarios = async () => {
  const informeRespuesta = new InformeRespuesta();
  const usuarios = await Usuario.find();
  /* .populate({ path: "incidenciasSeguidas", model: "Incidencia", select: "nombre descripcion" }); */
  /* .populate("incidenciasSeguidas.incidencia", "nombre descripcion"); */
  /* const usuarios = await Usuario.find()
    .populate("incidenciasSeguidas")
    .then(usuario => {
      res.json(usuario);
    }); */
  informeRespuesta.jsonResponse = estructuraJsonResponse({ usuarios });
  return informeRespuesta;
};

const getUsuario = async idUsuario => {
  const informeRespuesta = new InformeRespuesta();
  const usuario = await Usuario.findById(idUsuario);
  if (usuario) {
    informeRespuesta.jsonResponse = estructuraJsonResponse({ usuario });
  } else {
    informeRespuesta.error = generaError("El usuario solicitado no existe", 404);
  }
  return informeRespuesta;
};

const postUsuario = async usuarioRecibido => {
  const informeRespuesta = new InformeRespuesta();
  const usuarioEncontrado = await Usuario.findOne({
    email: usuarioRecibido.email,
    telefono: usuarioRecibido.telefono
  });
  let usuarioCreado;
  if (usuarioEncontrado) {
    informeRespuesta.error = generaError("El usuario ya existe", 409);
  } else {
    const fecha = new Date().getTime();
    usuarioRecibido.fechaAlta = +fecha;
    usuarioCreado = await Usuario.create(usuarioRecibido);
  }
  if (!informeRespuesta.error) {
    const mensaje = {
      from: "ciutadaverd@outlook.es",
      to: usuarioCreado.email,
      subject: "Confirmación registro en Ciutadà Verd",
      html: (`<h1>Su registro ha sido confirmado</h1><br/><p>Muchas gracias por registrarte con nosotros, ${usuarioCreado.nombre}. Hoy eres un ciudadano más comprometido con el ambiente y con la ciudad.</p><br/><p style="color:#5d9b9b">Para seguir navegando en nuestra web presiona <strong style="text-decoration-line:underline">aquí</strong></p>`)
    };
    transport.sendMail(mensaje);
    informeRespuesta.jsonResponse = estructuraJsonResponse({ usuario: usuarioCreado });
  }
  return informeRespuesta;
};

const putUsuario = async (usuarioRecibido, idUsuario) => {
  const informeRespuesta = new InformeRespuesta();
  let usuarioCoincidente;
  try {
    usuarioCoincidente = await Usuario.findById(idUsuario);
  } catch (err) {
    if (err.message === `Cast to ObjectId failed for value "${err.value}" at path "_id" for model "Usuario"`) {
      informeRespuesta.error = generaError("La id introducida no tiene la forma correcta", 400);
    }
  }
  if (usuarioCoincidente && !informeRespuesta.error) {
    await usuarioCoincidente.updateOne(usuarioRecibido);
    informeRespuesta.jsonResponse = estructuraJsonResponse({ usuario: usuarioRecibido });
  } else if (!informeRespuesta.error) {
    informeRespuesta.error = generaError("La id introducida no corresponde a ningún usuario", 400);
  }
  return informeRespuesta;
};

const borrarUsuario = async idUsuario => {
  const informeRespuesta = new InformeRespuesta();
  let usuarioCoincidente = null;
  try {
    usuarioCoincidente = await Usuario.findById(idUsuario);
  } catch (err) {
    if (err.message === `Cast to ObjectId failed for value "${err.value}" at path "_id" for model "Usuario"`) {
      informeRespuesta.error = generaError("La id introducida no tiene la forma correcta", 400);
    }
  }
  if (usuarioCoincidente && !informeRespuesta.error) {
    informeRespuesta.jsonResponse = estructuraJsonResponse({ usuario: usuarioCoincidente });
    await Usuario.findByIdAndDelete(idUsuario);
  } else if (!informeRespuesta.error) {
    informeRespuesta.error = generaError("La id introducida no corresponde a ninguna usuario", 400);
  }
  return informeRespuesta;
};
module.exports = {
  getUsuarios,
  getUsuario,
  postUsuario,
  putUsuario,
  borrarUsuario
};
