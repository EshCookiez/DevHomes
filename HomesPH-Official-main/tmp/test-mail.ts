// Mocking environment variables if needed, though they should be picked up from .env automatically in local dev
import 'dotenv/config' 
import nodemailer from 'nodemailer'

async function testSmtp() {
  const host = process.env.MAIL_HOST || 'smtp.hostinger.com'
  const port = Number(process.env.MAIL_PORT || '465')
  const user = process.env.MAIL_USERNAME || 'news@homes.ph'
  const pass = process.env.MAIL_PASSWORD || 'X1x2x3@8713'

  console.log('Testing SMTP with:', { host, port, user })

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  try {
    const verified = await transporter.verify()
    console.log('✅ SMTP connection successful:', verified)
    
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'HomesPH Dev'}" <${user}>`,
      to: 'jeabayona96@gmail.com', // Using user's likely email or a test one
      subject: 'SMTP Connectivity Test - HomesPH',
      text: 'This is a test email to verify that your Hostinger SMTP configuration is working correctly.',
      html: '<h1>SMTP Connectivity Test</h1><p>Your Hostinger SMTP configuration is working correctly!</p>'
    })
    
    console.log('✅ Test email sent successfully:', info.messageId)
  } catch (error) {
    console.error('❌ SMTP Error:', error)
  }
}

testSmtp()
