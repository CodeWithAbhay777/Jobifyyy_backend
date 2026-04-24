import axios from 'axios';
import { tryCatch } from 'bullmq';

const runCode = async (source_code, language_id) => {

  try {

    if (!source_code || !language_id) {
      return {
        success: false,
        error: "Source code and language ID are required."
      }
    }
    const res = await axios.post(
      "https://ce.judge0.com/submissions?wait=true",
      {
        source_code: source_code,
        language_id: language_id
      }
    );

    return {
      success: true,
      response: res.data
    };

  } catch (error) {
    console.log(error.message);
    return {
      success: false,
      error: error.message || "An error occurred while executing the code."
    };
  }


};

export default runCode;

