import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private useSendGrid = false;

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      this.logger.log('✅ SendGrid configured');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.useSendGrid = true;
    } else {
      this.logger.warn('⚠️  SENDGRID_API_KEY not found');
    }
  }

  async sendNewPassword(to: string, password: string): Promise<boolean> {
    const brandName = process.env.BRAND_NAME || 'Smartbit';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@smartbit.one';
    const appUrl = process.env.APP_URL || 'https://smartbit.one';
    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || '')
      .trim()
      .toLowerCase();

    const subject = `[${brandName}] Your password has been reset`;

    const text = `
${brandName} — Password Reset

Hello,

Your password has been reset. Use the temporary password below to sign in:

Temporary password: ${password}

For your security:
- Please change this password immediately after logging in.
- If you did not request this change, please contact us at ${supportEmail}.

Sign in: ${appUrl}

Thanks,
${brandName} Team
`.trim();

    const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${brandName} - Password Reset</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0;">
      <tr>
        <td align="center">

          <table role="presentation" width="600" cellspacing="0" cellpadding="0"
            style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,0.08);text-align:center;">

            <!-- Header -->
            <tr>
              <td style="padding:22px 28px;background:#111827;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">
                  ${brandName}
                </div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:6px;">
                  Account security notification
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px 28px;text-align:center;">
                <h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.35;color:#111827;">
                  Your password has been reset
                </h1>

                <p style="margin:0 0 18px 0;font-size:14.5px;line-height:1.7;color:#374151;">
                  Hi there,<br/>
                  We generated a temporary password for your account.<br/>
                  Please use it to sign in, then change it immediately.
                </p>

                <!-- Password box -->
                <table role="presentation" align="center" cellspacing="0" cellpadding="0"
                  style="margin:22px auto;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 20px;text-align:center;">
                      <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">
                        Temporary password
                      </div>
                      <div style="font-size:20px;font-weight:700;letter-spacing:1px;color:#111827;">
                        ${password}
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- CTA Button -->
                <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:24px auto 10px;">
                  <tr>
                    <td align="center" style="background:#111827;border-radius:12px;">
                      <a href="${appUrl}" target="_blank"
                        style="display:inline-block;padding:14px 22px;font-size:14.5px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
                        Sign in to your account
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:14px 0 0 0;font-size:12.5px;line-height:1.6;color:#6b7280;">
                  If you didn’t request this change,<br/>
                  contact us immediately at
                  <a href="mailto:${supportEmail}" style="color:#111827;text-decoration:underline;">
                    ${supportEmail}
                  </a>.
                </p>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:26px 0;" />

                <p style="margin:0;font-size:12.5px;line-height:1.6;color:#6b7280;">
                  <strong>Security tips</strong><br/>
                  • Don’t share your password with anyone<br/>
                  • Use a strong, unique password for each service
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  © ${new Date().getFullYear()} ${brandName}. All rights reserved.
                  <br/>
                  Need help?
                  <a href="mailto:${supportEmail}" style="color:#111827;text-decoration:underline;">
                    Contact support
                  </a>
                </p>
              </td>
            </tr>
          </table>

          <!-- Sub footer -->
          <div style="max-width:600px;width:100%;padding:12px 16px;color:#9ca3af;font-size:11px;line-height:1.5;text-align:center;">
            This is an automated message. Please do not reply to this email.
          </div>

        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

    if (this.useSendGrid) {
      try {
        if (!fromEmail) throw new Error('Missing SENDGRID_FROM_EMAIL');

        await sgMail.send({
          to,
          from: { email: fromEmail, name: brandName },
          subject,
          text,
          html,
          replyTo: { email: supportEmail, name: `${brandName} Support` },
        });

        this.logger.log(`✅ Email sent via SendGrid to ${to}`);
        return true;
      } catch (error) {
        this.logger.error(
          '❌ SendGrid failed:',
          error.response?.body || error.message,
        );
        return false;
      }
    }

    this.logger.error('❌ No email service available');
    return false;
  }

  async sendEmailVerification(
    to: string,
    confirmLink: string,
    code: string,
    token: string,
  ): Promise<boolean> {
    const brandName = process.env.BRAND_NAME || 'Smartbit';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@smartbit.one';
    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || '')
      .trim()
      .toLowerCase();

    const subject = `[${brandName}] Verify your email`;

    const text = `
${brandName} — Email Verification

Hello,

Please verify your email by clicking the link below:
${confirmLink}

Or enter this verification code:
${code}

Or use this token for testing:
${token}

This code will expire soon. If you didn't create this account, you can ignore this email.

Thanks,
${brandName} Team
`.trim();

    const html = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${brandName} - Verify Email</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0"
            style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(17,24,39,0.08);text-align:center;">
            <tr>
              <td style="padding:22px 28px;background:#111827;text-align:center;">
                <div style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">
                  ${brandName}
                </div>
                <div style="font-size:12px;color:#cbd5e1;margin-top:6px;">
                  Email verification
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;text-align:center;">
                <h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.35;color:#111827;">
                  Verify your email
                </h1>
                <p style="margin:0 0 18px 0;font-size:14.5px;line-height:1.7;color:#374151;">
                  Click the button below to confirm your email address.
                </p>
                <table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:20px auto 10px;">
                  <tr>
                    <td align="center" style="background:#111827;border-radius:12px;">
                      <a href="${confirmLink}" target="_blank"
                        style="display:inline-block;padding:14px 22px;font-size:14.5px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">
                        Verify email
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 8px 0;font-size:13px;color:#6b7280;">
                  Or use this verification code:
                </p>
                <div style="display:inline-block;padding:12px 18px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;font-size:18px;font-weight:700;letter-spacing:2px;">
                  ${code}
                </div>
                <p style="margin:24px 0 8px 0;font-size:13px;color:#6b7280;">
                  Verification Token (for testing):
                </p>
                <div style="background:#f3f4f6; border:1px solid #e5e7eb; border-radius:10px; padding:12px; margin:0 auto; max-width:400px;">
                  <input readonly value="${token}" style="width:100%; border:none; background:transparent; font-family:monospace; font-size:12px; color:#374151; text-align:center; outline:none;" onclick="this.select()" />
                </div>
                <p style="margin:18px 0 0 0;font-size:12.5px;line-height:1.6;color:#6b7280;">
                  If you didn’t request this, you can safely ignore this email.
                  Need help? <a href="mailto:${supportEmail}" style="color:#111827;text-decoration:underline;">Contact support</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

    if (this.useSendGrid) {
      try {
        if (!fromEmail) throw new Error('Missing SENDGRID_FROM_EMAIL');

        await sgMail.send({
          to,
          from: { email: fromEmail, name: brandName },
          subject,
          text,
          html,
          replyTo: { email: supportEmail, name: `${brandName} Support` },
        });

        this.logger.log(`✅ Email verification sent via SendGrid to ${to}`);
        return true;
      } catch (error) {
        this.logger.error(
          '❌ SendGrid failed:',
          error.response?.body || error.message,
        );
        return false;
      }
    }

    this.logger.error('❌ No email service available');
    return false;
  }
}
