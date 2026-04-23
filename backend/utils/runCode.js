import axios from 'axios';

const runCode = async (source_code , language_id) => {

  if (!source_code || !language_id) {
    return {
      success: false,
      error: "Source code and language ID are required."
    }
  }
  const res = await axios.post(
    "https://ce.judge0.com/submissions?wait=true",
    {
      source_code: source_code ,
      language_id: language_id
    }
  );

  return {
    success: true,
    response : res.data
  };
};

export default runCode;

