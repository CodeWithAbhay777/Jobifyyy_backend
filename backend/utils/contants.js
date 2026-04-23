export const accessCookieOptions = {
  httpOnly: true,
  //   secure: true,
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

export const refreshCookieOptions = {
  httpOnly: true,
  //   secure: true,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000,
}

export const scoreWeights = {
  difficultyWeight : {
    easy : 0.8,
    medium : 1,
    hard : 1.2
  },

  finalWeight : {
    recruiter : 0.7,
    AI : 0.3
  },

  idealQuestions : 5
}