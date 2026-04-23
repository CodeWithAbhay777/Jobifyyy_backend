export const sendInterviewInfoEmailToCandidate = (email , username , title , department , type , experienceLevel , scheduledAt) => {
    let formattedDate = scheduledAt;
  try {
    const d = new Date(scheduledAt);
    if (!isNaN(d)) {
      formattedDate = new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
      }).format(d);
    }
  } catch (e) {
    // keep scheduledAt as-is
    console.log(e);
  }

  const dashboardLink = `${process.env.CLIENT_URL}/candidate/upcoming-interviews`;

  const mailOptions = {
    to: email,
    subject: `Interview Scheduled for ${title} - Jobifyyy`,
    text: `Hello ${username}, your interview for the ${title} position in the ${department} department has been scheduled for ${formattedDate}. View upcoming interviews: ${dashboardLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2C3E50; margin: 0 0 8px;">Interview Scheduled</h2>
        <p style="font-size: 16px; color: #555; margin: 0 0 12px;">Hi <strong>${username}</strong>,</p>

        <p style="font-size: 15px; color: #555; margin: 0 0 12px;">
          Good news — your interview for the <strong>${title}</strong> position has been scheduled.
        </p>

        <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 6px 0;"><strong>Department:</strong> ${department}</p>
          <p style="margin: 6px 0;"><strong>Job Type:</strong> ${type}</p>
          <p style="margin: 6px 0;"><strong>Experience Level:</strong> ${experienceLevel}</p>
          <p style="margin: 6px 0;"><strong>Scheduled At:</strong> ${formattedDate}</p>
        </div>

        <p style="margin-top: 18px; font-size: 15px; color: #666;">
          You can view the details under <a href="${dashboardLink}" style="color: #007bff; text-decoration: none;">upcoming interviews</a>.
        </p>

        <p style="margin-top: 22px; color: #888; font-size: 13px;">
          Best wishes,<br/>
          <strong>The Jobifyyy Team</strong>
        </p>
      </div>
    `,
  };

  return mailOptions;
}