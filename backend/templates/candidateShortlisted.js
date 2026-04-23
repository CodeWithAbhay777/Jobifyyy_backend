export const sendCandidateShortlistedEmail = (email, username, title, department, dashboardPath = "/candidate/upcoming-interviews") => {
	const dashboardLink = `${process.env.CLIENT_URL}${dashboardPath}`;

	const mailOptions = {
		to: email,
		subject: `Shortlisted for Next Stage - ${title} | Jobifyyy`,
		text: `Hello ${username}, congratulations. You have been shortlisted for the next stage of the ${title} role in the ${department} department. Please check your dashboard for upcoming instructions: ${dashboardLink}`,
		html: `
			<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
				<h2 style="color: #2C3E50; margin: 0 0 8px;">You Have Been Shortlisted</h2>

				<p style="font-size: 16px; color: #555; margin: 0 0 12px;">Hi <strong>${username}</strong>,</p>

				<p style="font-size: 15px; color: #555; margin: 0 0 12px;">
					Thank you for participating in the interview process.
					We are pleased to inform you that you have been <strong>shortlisted</strong> for the next stage.
				</p>

				<div style="background: #f8f9fa; padding: 15px 20px; border-radius: 8px; margin-top: 10px;">
					<p style="margin: 6px 0;"><strong>Role:</strong> ${title}</p>
					<p style="margin: 6px 0;"><strong>Department:</strong> ${department}</p>
					<p style="margin: 6px 0;"><strong>Status:</strong> Shortlisted</p>
				</div>

				<p style="margin-top: 18px; font-size: 15px; color: #666;">
					Our team will share the next steps shortly. You can track all updates from your
					<a href="${dashboardLink}" style="color: #007bff; text-decoration: none;">candidate dashboard</a>.
				</p>

				<p style="margin-top: 22px; color: #888; font-size: 13px;">
					Regards,<br/>
					<strong>Team Jobifyyy</strong>
				</p>
			</div>
		`,
	};

	return mailOptions;
};
