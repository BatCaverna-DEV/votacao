import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function enviarConfirmacaoVoto({ nome, email, eleicao, urna }) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#004d2b,#00A651);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">VotaIF</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.75);font-size:13px;">Campus Coelho Neto · IFMA</p>
          </td>
        </tr>

        <!-- Ícone de sucesso -->
        <tr>
          <td style="padding:32px 40px 0;text-align:center;">
            <div style="width:72px;height:72px;background:#e6f7ee;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:0 auto;">
              <span style="font-size:36px;">✅</span>
            </div>
            <h2 style="margin:16px 0 4px;color:#1a1a1a;font-size:22px;font-weight:700;">Voto registrado com sucesso!</h2>
            <p style="margin:0;color:#6c757d;font-size:15px;">Olá, <strong>${nome}</strong>. Sua participação foi confirmada.</p>
          </td>
        </tr>

        <!-- Detalhes -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:14px 20px;border-bottom:1px solid #e9ecef;">
                  <span style="color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;">Eleição</span><br/>
                  <span style="color:#1a1a1a;font-size:15px;font-weight:600;">${eleicao}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 20px;">
                  <span style="color:#6c757d;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;">Urna</span><br/>
                  <span style="color:#1a1a1a;font-size:15px;font-weight:600;">${urna}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Aviso -->
        <tr>
          <td style="padding:0 40px 16px;">
            <div style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:6px;padding:12px 16px;">
              <p style="margin:0;color:#856404;font-size:13px;">
                ⚠️ <strong>Sigilo garantido:</strong> este e-mail confirma apenas sua participação. O conteúdo do seu voto é sigiloso e não está registrado aqui.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 32px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#adb5bd;font-size:12px;">
              VotaIF · IFMA Campus Coelho Neto<br/>
              Este e-mail foi gerado automaticamente. Não responda.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: '✅ Voto confirmado — VotaIF IFMA',
    html,
  });
}
