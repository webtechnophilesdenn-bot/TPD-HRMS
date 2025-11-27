const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Resume Ranking
exports.rankResumesAI = async (job, candidates) => {
  try {
    const rankedCandidates = [];

    for (const candidate of candidates) {
      const prompt = `
Job Description:
${job.description}

Required Skills: ${job.skills?.join(", ")}
Required Experience: ${job.experience}
Seniority Level: ${job.seniorityLevel}

Candidate Information:
- Name: ${candidate.name}
- Current Designation: ${candidate.currentDesignation}
- Current Company: ${candidate.currentCompany}
- Total Experience: ${candidate.totalExperience} years
- Skills: ${candidate.resume || "Not specified"}
- Notice Period: ${candidate.noticePeriod}

Rate this candidate on a scale of 0-100 based on how well they match the job requirements.
Consider skills match, experience level, and overall fit.
Only return the numeric score.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0.3,
      });

      const score =
        parseInt(completion.choices[0].message.content.trim()) || 50;

      rankedCandidates.push({
        ...candidate.toObject(),
        aiScore: score,
        overallRating: score,
      });
    }

    // Sort by score
    return rankedCandidates.sort((a, b) => b.aiScore - a.aiScore);
  } catch (error) {
    console.error("AI Ranking Error:", error);
    // Return candidates with default scores if AI fails
    return candidates.map((candidate) => ({
      ...candidate.toObject(),
      aiScore: 50,
      overallRating: 50,
    }));
  }
};

// Job Description Analysis
// exports.analyzeJobDescription = async (jobDescription) => {
//   try {
//     const prompt = `
// Analyze the following job description and extract:
// 1. Key skills required (return as array)
// 2. Seniority level (choose from: Intern, Junior, Mid-Level, Senior, Lead, Manager, Director)
// 3. Required experience in years (estimate based on description)

// Job Description:
// ${jobDescription}

// Return the response as a JSON object with this exact structure:
// {
//   "skills": ["skill1", "skill2", "skill3"],
//   "seniorityLevel": "Mid-Level",
//   "requiredExperience": 3
// }
//     `;

//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [{ role: "user", content: prompt }],
//       max_tokens: 500,
//       temperature: 0.2,
//     });

//     const response = completion.choices[0].message.content.trim();

//     try {
//       const analysis = JSON.parse(response);
//       return {
//         skills: analysis.skills || [],
//         seniorityLevel: analysis.seniorityLevel || "Mid-Level",
//         requiredExperience: analysis.requiredExperience || 2,
//       };
//     } catch (parseError) {
//       console.error("JSON Parse Error:", parseError);
//       return {
//         skills: extractSkillsFallback(jobDescription),
//         seniorityLevel: "Mid-Level",
//         requiredExperience: 2,
//       };
//     }
//   } catch (error) {
//     console.error("Job Analysis Error:", error);
//     return {
//       skills: extractSkillsFallback(jobDescription),
//       seniorityLevel: "Mid-Level",
//       requiredExperience: 2,
//     };
//   }
// };


exports.analyzeJobDescription = async (description) => {
  return {
    summary: "AI temporarily disabled",
    keywords: ["AI-disabled"],
    category: "General"
  };
};


// Fallback skill extraction
function extractSkillsFallback(jobDescription) {
  const commonSkills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "SQL",
    "AWS",
    "HTML",
    "CSS",
    "TypeScript",
    "Angular",
    "Vue",
    "MongoDB",
    "PostgreSQL",
    "Docker",
    "Kubernetes",
    "Git",
    "REST API",
    "GraphQL",
    "Machine Learning",
    "Data Analysis",
    "Project Management",
    "Agile",
    "Scrum",
    "Communication",
    "Problem Solving",
    "Leadership",
    "Teamwork",
  ];

  const foundSkills = commonSkills.filter((skill) =>
    jobDescription.toLowerCase().includes(skill.toLowerCase())
  );

  return foundSkills.length > 0 ? foundSkills : ["General Skills"];
}

// Chatbot Response
exports.getChatbotResponse = async (message, employee) => {
  try {
    const systemPrompt = `You are an HR assistant chatbot for an HRMS system. 
Employee details: ${employee.firstName} ${employee.lastName}, ${
      employee.designation?.title || "Employee"
    }
Answer HR-related queries about leaves, attendance, payroll, policies, etc.
Keep responses concise and helpful.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 200,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "Sorry, I could not process your request. Please contact HR.";
  }
};

// Keep the old function for backward compatibility
exports.rankResumes = exports.rankResumesAI;
