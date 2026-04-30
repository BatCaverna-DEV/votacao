import 'dotenv/config';
import nodemailer from 'nodemailer';

console.log('Configurações SMTP:');
console.log('  Host:', process.env.MAIL_HOST);
console.log('  Port:', process.env.MAIL_PORT);
console.log('  Secure:', process.env.MAIL_SECURE);
console.log('  User:', process.env.MAIL_USER);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

console.log('\nTestando conexão SMTP...');
try {
  await transporter.verify();
  console.log('✅ Conexão SMTP OK!');

  console.log('\nEnviando e-mail de teste...');
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_USER,
    subject: 'Teste VotaIF',
    text: 'Se você recebeu este e-mail, o SMTP está funcionando corretamente.',
  });
  console.log('✅ E-mail enviado! MessageId:', info.messageId);
} catch (err) {
  console.error('❌ Erro:', err.message);
  console.error('   Code:', err.code);
  console.error('   Response:', err.response);
}
