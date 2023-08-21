const https = require('https');
const fs = require('fs');
const axios = require('axios');

async function checkSslExpiry(domain) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://${domain}`, (res) => {
      const daysUntilExpiry = Math.floor(
        (new Date(res.socket.getPeerCertificate().valid_to) - new Date()) / (1000 * 60 * 60 * 24)
      );
      resolve(daysUntilExpiry);
    });

    req.on('error', reject);
  });
}

(async () => {
  try {
    const domains = fs.readFileSync('domains.txt', 'utf8').trim().split('\n');

    for (const domain of domains) {
      const daysUntilExpiry = await checkSslExpiry(domain);
      
      const message = `SSL Expiry Alert\n` +
        `   * Domain : ${domain}\n` +
        `   * Warning : The SSL certificate for ${domain} will expire in ${daysUntilExpiry} days.`;

      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      await axios.post(slackWebhookUrl, { text: message });
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
