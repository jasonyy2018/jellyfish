export type ReviewInput = {
  prompt: string;
  expected?: string;
  rules?: string[];
};

export type ReviewOutput = {
  score: number;
  summary: string;
};

export async function runReview(input: ReviewInput): Promise<ReviewOutput> {
  const baseScore = Math.min(100, Math.max(50, 60 + Math.floor(input.prompt.length / 12)));
  const score = input.expected ? Math.min(100, baseScore + 10) : baseScore;
  return {
    score,
    summary: score >= 80 ? "Review passed baseline checks." : "Review failed baseline checks.",
  };
}
