export const WAITLIST_THANK_YOU_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're on the waitlist</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Roboto,Segoe UI,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;">
          <tr>
            <td style="padding:0 0 24px;">
              <img src="{{logoUrl}}" alt="Humans First" width="160" style="display:block;width:160px;max-width:160px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">Hi {{firstName}},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">
                Thank you for registering for <strong>{{eventName}}</strong>.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">
                You are on the waitlist. We will email you as soon as your seat is confirmed with your event pass and details.
              </p>
              <p style="margin:0 0 10px;font-size:15px;font-weight:700;line-height:1.5;color:#111111;">Event Details</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#111111;">&#128197; <strong>Date:</strong> {{eventDateLong}}</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#111111;">&#128339; <strong>Time:</strong> {{eventTime}}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">&#128205; <strong>Location:</strong> {{eventLocationFull}}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">We appreciate your interest and look forward to welcoming you.</p>
              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#111111;">Warm regards,</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#111111;font-weight:600;">Team HFMS</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const WAITLIST_REJECTED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration update</title>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Roboto,Segoe UI,Helvetica,Arial,sans-serif;color:#111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:28px 16px 40px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:680px;">
          <tr>
            <td style="padding:0 0 24px;">
              <img src="{{logoUrl}}" alt="Humans First" width="160" style="display:block;width:160px;max-width:160px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">Hi {{firstName}},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">
                Thank you for your interest in <strong>{{eventName}}</strong>.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#111111;">
                Unfortunately, we are unable to confirm your seat for this event at this time.
              </p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#111111;">
                We hope to see you at a future Humans First Series event.
              </p>
              <p style="margin:0 0 4px;font-size:15px;line-height:1.6;color:#111111;">Warm regards,</p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#111111;font-weight:600;">Team HFMS</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
