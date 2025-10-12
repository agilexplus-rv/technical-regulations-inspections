export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, email not sent');
      return { success: false, error: 'Email service not configured' };
    }

    // Use fetch directly to avoid Resend dependency issues
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || process.env.FROM_EMAIL || 'triapp@mccaa.org.mt',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email sending error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email sending error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendPasswordResetEmail(email: string, tempPassword: string, resetBy?: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset - TRIAPP</h2>
      <p>Your password has been reset${resetBy ? ` by ${resetBy}` : ' by an administrator'}.</p>
      <p><strong>Your temporary password is:</strong> <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
      <p>Please log in with this temporary password and change it immediately.</p>
      <p>If you did not request this password reset, please contact your administrator.</p>
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from TRIAPP.<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset - TRIAPP',
    html,
  });
}

export async function sendUserCreatedEmail(email: string, tempPassword: string, createdBy: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to TRIAPP</h2>
      <p>Hello,</p>
      <p>Your account has been created by <strong>${createdBy}</strong>.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Login Credentials:</h3>
        <ul style="margin: 0;">
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></li>
        </ul>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice:</h4>
        <ul style="color: #856404; margin: 0;">
          <li><strong>You must change your password immediately</strong> after your first login</li>
          <li>Use a strong, unique password that you haven't used elsewhere</li>
          <li>Your temporary password is only valid for initial access</li>
        </ul>
      </div>
      
      <p><strong>Next Steps:</strong></p>
      <ol>
        <li>Log in using the credentials above</li>
        <li>Navigate to Settings → Change Password</li>
        <li>Create a new, secure password</li>
        <li>Complete your profile setup</li>
      </ol>
      
      <p>If you have any questions or need assistance, please contact your administrator.</p>
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from TRIAPP.<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to TRIAPP - Action Required',
    html,
  });
}

export async function sendMFATokenEmail(email: string, mfaToken: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>MFA Verification Code - TRIAPP</h2>
      <p>Hello,</p>
      <p>You have requested to log in to TRIAPP with Multi-Factor Authentication enabled.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your MFA Verification Code:</h3>
        <p style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; background: #e9ecef; padding: 10px; border-radius: 4px; letter-spacing: 2px; margin: 10px 0;">${mfaToken}</p>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #856404; margin-top: 0;">⚠️ Security Notice:</h4>
        <ul style="color: #856404; margin: 0;">
          <li>This code will expire in 2 minutes</li>
          <li>Do not share this code with anyone</li>
          <li>TRIAPP will never ask for this code via phone or email</li>
        </ul>
      </div>
      
      <p>If you did not request this login, please contact your administrator immediately.</p>
      
      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated message from TRIAPP.<br>
        Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'MFA Verification Code - TRIAPP',
    html,
  });
}
