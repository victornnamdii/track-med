import axios from 'axios';
import env from '../config/env';

class WhatsappClient {
  client = axios.create({
    baseURL: 'https://gate.whapi.cloud/messages',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });

  async sendReminder(
    phoneNumber: string,
    medicationName: string,
    message: string,
    link: string
  ) {
    const data = {
      typing_time: 10,
      to: `${phoneNumber}@s.whatsapp.net`,
      body: 
      `*‼️REMINDER FOR ${medicationName
        .toUpperCase()}💊 ‼️*\n\n${
        message}\n\nIf you have taken them, Open the link below:\n\n${link}`
    };
    await this.client.post(`/text?token=${env.WHAPI_TOKEN}`, data);
  }
}

const whatsappClient = new WhatsappClient();

export default whatsappClient;