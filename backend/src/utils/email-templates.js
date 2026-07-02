const bienvenida = (nombre) => ({
  subject: '¡Bienvenido a Teleticket!',
  html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Teleticket</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0F;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:700;color:#7C3AED;letter-spacing:-0.5px;">Teleticket</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#15151D;border-radius:12px;padding:40px 36px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#FFFFFF;">¡Hola, ${nombre}!</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#A0A0B0;line-height:1.6;">
                Tu cuenta en Teleticket ha sido creada exitosamente. Ya puedes explorar los mejores conciertos
                y adquirir tus entradas de forma rápida y segura.
              </p>
              <p style="margin:0;font-size:15px;color:#A0A0B0;line-height:1.6;">
                Gracias por unirte a nosotros. ¡Disfruta los eventos!
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4A4A5A;">
                © 2025 Teleticket. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
});

const confirmacionCompra = (nombre, evento, zona, precio, uuid) => ({
  subject: `Tu entrada para ${evento} está confirmada`,
  html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmación de compra</title>
</head>
<body style="margin:0;padding:0;background-color:#0A0A0F;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A0A0F;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:28px;font-weight:700;color:#7C3AED;letter-spacing:-0.5px;">Teleticket</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#15151D;border-radius:12px;padding:40px 36px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#FFFFFF;">¡Compra confirmada!</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#A0A0B0;">
                Hola ${nombre}, tu entrada ha sido reservada correctamente.
              </p>
              <!-- Ticket detail box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background-color:#1E1E2A;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 12px;font-size:13px;color:#7C3AED;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">
                      Detalle de tu entrada
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#A0A0B0;width:40%;">Evento</td>
                        <td style="padding:6px 0;font-size:14px;color:#FFFFFF;font-weight:600;">${evento}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#A0A0B0;">Zona</td>
                        <td style="padding:6px 0;font-size:14px;color:#FFFFFF;font-weight:600;">${zona}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#A0A0B0;">Precio</td>
                        <td style="padding:6px 0;font-size:14px;color:#FFFFFF;font-weight:600;">S/ ${Number(precio).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#A0A0B0;">Código</td>
                        <td style="padding:6px 0;font-size:12px;color:#7C3AED;font-family:monospace;word-break:break-all;">${uuid}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#A0A0B0;line-height:1.6;">
                Presenta el código QR desde la app al ingresar al evento. El código se renueva cada 30 segundos
                como medida de seguridad.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4A4A5A;">
                © 2025 Teleticket. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
});

module.exports = { bienvenida, confirmacionCompra };
