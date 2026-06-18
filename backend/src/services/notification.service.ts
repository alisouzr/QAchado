import nodemailer from 'nodemailer';

// Configuração do transportador do Nodemailer (Preencher com as credenciais do seu SMTP corporativo ou Mailtrap)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export const NotificationService = {
  /**
   * Dispara um e-mail formatado de forma assíncrona
   */
  async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      await transporter.sendMail({
        from: '"Security Portal" <security@company.com>',
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[Notification] E-mail enviado com sucesso para ${to}`);
    } catch (error) {
      console.error('[Notification Error] Falha ao disparar e-mail:', error);
    }
  },

  /**
   * Dispara um payload estruturado para canais do Slack ou Teams (Webhook nativo)
   */
  async sendChatWebhook(webhookUrl: string, messageText: string, blocks?: any[]): Promise<void> {
    try {
      if (!webhookUrl) return;

      const payload = {
        text: messageText,
        ...(blocks && { blocks }), // Suporte nativo ao Block Kit do Slack se fornecido
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
      }
      console.log('[Notification] Webhook enviado para o chat corporativo com sucesso.');
    } catch (error) {
      console.error('[Notification Error] Falha ao disparar mensagem para o Webhook:', error);
    }
  }
};