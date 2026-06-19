export const JOIN_EMAIL_NAV_HTML = `
          <tr>
            <td style="padding:18px 16px;background-color:#ffffff;border-bottom:1px solid #e4e4e7;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="left" valign="middle" style="vertical-align:middle;width:18%;white-space:nowrap;">
                    <a href="{{bookUrl}}" style="font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:9px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;color:#111111;text-decoration:none;">
                      THE BOOK
                    </a>
                    <span style="display:inline-block;width:10px;">&nbsp;</span>
                    <a href="{{citiesUrl}}" style="font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:9px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;color:#111111;text-decoration:none;">
                      CITIES
                    </a>
                  </td>
                  <td align="center" valign="middle" style="vertical-align:middle;width:34%;padding:0 6px;">
                    <a href="{{homeUrl}}" style="text-decoration:none;">
                      <img src="{{navLogoUrl}}" alt="Humans First" width="136" style="display:block;width:136px;max-width:136px;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
                    </a>
                  </td>
                  <td align="right" valign="middle" style="vertical-align:middle;width:48%;white-space:nowrap;">
                    <a href="{{watchUrl}}" style="font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:9px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;color:#111111;text-decoration:none;">
                      WATCH
                    </a>
                    <span style="display:inline-block;width:10px;">&nbsp;</span>
                    <a href="{{wallUrl}}" style="font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:9px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;color:#111111;text-decoration:none;">
                      THE WALL
                    </a>
                    <span style="display:inline-block;width:10px;">&nbsp;</span>
                    <a href="{{homeUrl}}" style="display:inline-block;padding:10px 14px;border-radius:999px;background-color:#111111;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:8px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#ffffff;text-decoration:none;white-space:nowrap;">
                      JOIN THE MOVEMENT
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

export const JOIN_THANK_YOU_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Humans First</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f1ea;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Thank you, {{name}}. Your seat is reserved for {{city}}.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f1ea;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e7e5dd;border-radius:16px;overflow:hidden;">

${JOIN_EMAIL_NAV_HTML}

          <tr>
            <td style="padding:26px 28px 24px;background-color:#111111;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="middle" style="vertical-align:middle;padding-right:12px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#ecd225;line-height:1.2;">
                      Humans First
                    </p>
                    <h1 style="margin:0;font-size:26px;line-height:1.08;font-weight:900;text-transform:uppercase;color:#ffffff;">
                      Thank you
                    </h1>
                    <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#bdbdbd;">
                      Your seat is reserved — we are glad you are joining us.
                    </p>
                  </td>
                  <td align="right" valign="middle" width="152" style="width:152px;padding-left:20px;vertical-align:middle;text-align:right;">
                    <img src="{{logoUrl}}" alt="Humans First" width="132" style="display:block;width:132px;max-width:132px;height:auto;border:0;outline:none;text-decoration:none;margin:0 0 0 auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:17px;line-height:1.6;color:#111111;">
                Hi {{name}},
              </p>
              <p style="margin:0 0 20px;font-size:18px;line-height:1.55;color:#111111;font-weight:700;">
                Thank you for joining the Humans First movement.
              </p>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#444444;">
                We are grateful you chose to save your seat. You are now on the list for:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:18px 20px;border-radius:12px;background-color:#f4e04d;color:#111111;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
                      Your city
                    </p>
                    <p style="margin:0;font-size:22px;line-height:1.2;font-weight:800;">
                      {{city}}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#444444;">
                This is a free, public event with limited seats. We will send you venue details, timings, and next steps closer to the date.
              </p>

              <p style="margin:0 0 10px;font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#111111;">
                What to expect
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:1.7;color:#444444;">
                <li style="margin-bottom:8px;">A live conversation about what makes us human in the age of AI</li>
                <li style="margin-bottom:8px;">A community wall where attendees share what they will never give up</li>
                <li>An evening designed to inspire, not instruct</li>
              </ul>

              <p style="margin:0;font-size:15px;line-height:1.65;color:#444444;">
                Questions before then? Just reply to this email — we would love to hear from you.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 32px 28px;border-top:1px solid #eceae3;background-color:#faf9f6;">
              <p style="margin:0 0 4px;font-size:15px;line-height:1.5;color:#111111;font-weight:700;">
                Warm regards,
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#6b6b6b;">
                Vineet Nayar Team<br />
                Humans First Machine Second
              </p>
            </td>
          </tr>

        </table>

        <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#8a8a8a;text-align:center;">
          Humans First · Stay curious. Stay inspired.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

export const JOIN_NOTIFY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>Humans First</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f1ea;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111111;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    New reservation from {{name}} for {{city}}.
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f1ea;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e7e5dd;border-radius:16px;">

${JOIN_EMAIL_NAV_HTML}

          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:#6b6b6b;line-height:1.2;">
                Humans First
              </p>
              <h1 style="margin:0;font-size:26px;line-height:1.08;font-weight:900;text-transform:uppercase;color:#111111;">
                New seat reservation
              </h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#6b6b6b;">
                Someone just saved their place through the website.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#444444;">
                A new registration came in from the <strong>Join the movement</strong> form.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #eceae3;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;width:120px;vertical-align:top;">
                    Name
                  </td>
                  <td style="padding:12px 0 12px 16px;border-bottom:1px solid #eceae3;font-size:16px;line-height:1.5;color:#111111;vertical-align:top;">
                    {{name}}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #eceae3;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;width:120px;vertical-align:top;">
                    Email
                  </td>
                  <td style="padding:12px 0 12px 16px;border-bottom:1px solid #eceae3;font-size:16px;line-height:1.5;color:#111111;vertical-align:top;">
                    {{email}}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #eceae3;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;width:120px;vertical-align:top;">
                    City
                  </td>
                  <td style="padding:12px 0 12px 16px;border-bottom:1px solid #eceae3;font-size:16px;line-height:1.5;color:#111111;vertical-align:top;">
                    {{city}}
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #eceae3;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;width:120px;vertical-align:top;">
                    Submitted
                  </td>
                  <td style="padding:12px 0 12px 16px;border-bottom:1px solid #eceae3;font-size:16px;line-height:1.5;color:#111111;vertical-align:top;">
                    {{submittedAt}}
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="border-radius:999px;background-color:#111111;">
                    <a href="mailto:{{email}}" style="display:inline-block;padding:14px 24px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Reply to {{name}}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

        <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#8a8a8a;text-align:center;">
          Humans First · Stay curious. Stay inspired.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
