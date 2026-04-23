const formatScheduledDate = (scheduledAt) => {
  let formattedDate = scheduledAt;

  try {
    const d = new Date(scheduledAt);
    if (!isNaN(d)) {
      formattedDate = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: process.env.TIMEZONE || "Asia/Kolkata",
      }).format(d);
    }
  } catch (e) {
    console.log(e);
  }

  return formattedDate;
};

export const sendInterviewUpdateInfoToCandidate = (
  email,
  username,
  title,
  department,
  type,
  experienceLevel,
  scheduledAt
) => {
  const formattedDate = formatScheduledDate(scheduledAt);
  const dashboardLink = `${process.env.CLIENT_URL}/candidate/upcoming-interviews`;

  return {
    to: email,
    subject: `Interview Updated for ${title} - Jobifyyy`,
    text: `Hello ${username}, your interview details for the ${title} position have been updated. Please check your upcoming interviews. Current schedule: ${formattedDate}. Link: ${dashboardLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2C3E50; margin: 0 0 8px;">Interview Details Updated</h2>
        <p style="font-size: 16px; color: #555; margin: 0 0 12px;">Hi <strong>${username}</strong>,</p>

        <p style="font-size: 15px; color: #555; margin: 0 0 12px;">
          Your interview details have been updated. Please review the latest information below.
        </p>

        <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 6px 0;"><strong>Role:</strong> ${title}</p>
          <p style="margin: 6px 0;"><strong>Department:</strong> ${department}</p>
          <p style="margin: 6px 0;"><strong>Job Type:</strong> ${type}</p>
          <p style="margin: 6px 0;"><strong>Experience Level:</strong> ${experienceLevel}</p>
          <p style="margin: 6px 0;"><strong>Updated Schedule:</strong> ${formattedDate}</p>
        </div>

        <p style="margin-top: 18px; font-size: 15px; color: #666;">
          Please check your <a href="${dashboardLink}" style="color: #007bff; text-decoration: none;">upcoming interviews</a> page for full details.
        </p>

        <p style="margin-top: 22px; color: #888; font-size: 13px;">
          Regards,<br/>
          <strong>The Jobifyyy Team</strong>
        </p>
      </div>
    `,
  };
};

export const sendInterviewUpdateInfoToInterviewer = (
  email,
  username,
  title,
  department,
  type,
  experienceLevel,
  scheduledAt
) => {
  const formattedDate = formatScheduledDate(scheduledAt);
  const dashboardLink = `${process.env.CLIENT_URL}/recruiter/upcoming-interviews`;

  return {
    to: email,
    subject: `Interview Updated - ${title} | Jobifyyy`,
    text: `Hello ${username}, interview details for ${title} have been updated. Please check your dashboard. Current schedule: ${formattedDate}. Link: ${dashboardLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2C3E50; margin: 0 0 8px;">Interview Details Updated</h2>
        <p style="font-size: 16px; color: #555; margin: 0 0 12px;">Hi <strong>${username}</strong>,</p>

        <p style="font-size: 15px; color: #555; margin: 0 0 12px;">
          Interview details have been updated for an interview assigned to you. Please review the latest information.
        </p>

        <div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin-top: 10px;">
          <p style="margin: 6px 0;"><strong>Role:</strong> ${title}</p>
          <p style="margin: 6px 0;"><strong>Department:</strong> ${department}</p>
          <p style="margin: 6px 0;"><strong>Job Type:</strong> ${type}</p>
          <p style="margin: 6px 0;"><strong>Experience Level:</strong> ${experienceLevel}</p>
          <p style="margin: 6px 0;"><strong>Updated Schedule:</strong> ${formattedDate}</p>
        </div>

        <p style="margin-top: 18px; font-size: 15px; color: #666;">
          Please check <a href="${dashboardLink}" style="color: #007bff; text-decoration: none;">upcoming interviews</a> for full context.
        </p>

        <p style="margin-top: 22px; color: #888; font-size: 13px;">
          Regards,<br/>
          <strong>Team Jobifyyy</strong>
        </p>
      </div>
    `,
  };
};
