import OpenAI from "openai";
import "dotenv/config";



const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const evaluateAnswersByAI = async ({ question, candidateAnswer, difficulty }) => {
    try {

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",

            text: {
                format: {
                    type: "json_schema",
                    name: "evaluation",
                    schema: {
                        type: "object",
                        properties: {
                            accuracy: { type: "number" },
                            depth: { type: "number" },
                            clarity: { type: "number" },
                            confidence: { type: "number" },
                            totalScore: { type: "number" },
                            improvements: {
                                type: "array",
                                items: { type: "string" }
                            }
                        },
                        required: [
                            "accuracy",
                            "depth",
                            "clarity",
                            "confidence",
                            "totalScore",
                            "improvements"
                        ],

                        additionalProperties: false
                    }
                }
            },

            input: `You are an experienced technical interviewer.

Evaluate the candidate's answer based on the question and difficulty.

Question:
${question}

Answer:
${candidateAnswer}

Difficulty:
${difficulty}

Scoring rules:
- accuracy (0-10): correctness
- depth (0-10): explanation level
- clarity (0-10): communication
- confidence (0-10): tone & confidence

Also:
- totalScore = sum of all above (max 40)
- Give 2-3 improvement points
- Don't be too harsh on grammer or spelling, focus on technical content.
- Don't expect too perfect answers, just try to understand wheather the candidate has a good understanding of the concept and can communicate it well.  

Return ONLY JSON.`
        })

        const text = response.output_text || response.output?.[0]?.content?.[0]?.text;

      if (!text) {
        throw new Error("No output from AI");
      }

    const result = JSON.parse(text);

    return {response : result , success : true};

    } catch (error) {
        console.error("Error evaluating answers by AI:", error);
        return {response : null , success : false, error: error.message || "Error evaluating answers by AI" };
    }
}


export default evaluateAnswersByAI;


// console.log(await evaluateAnswersByAI({
//     question: "Explain the concept of closures in JavaScript.",
//     candidateAnswer: "A closure is a function that has access to its own scope, the outer function's scope, and the global scope. It allows a function to access variables from an enclosing scope even after it leaves the scope in which it was declared.",
//     difficulty: "medium"
// }));




