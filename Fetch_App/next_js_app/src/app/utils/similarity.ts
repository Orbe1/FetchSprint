export function jsonbToArray(jsonbEmbedding: Record<string, number>): number[] {
  const length = Object.keys(jsonbEmbedding).length;

  const array = new Array(length);

  for (let i = 0; i < length; i++) {
    array[i] = jsonbEmbedding[i.toString()];
  }

  return array;
}
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must be of the same length");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
}

export function magnitude(vector: number[]): number {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }

  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = dotProduct(a, b);
  const magA = magnitude(a);
  const magB = magnitude(b);

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (magA * magB);
}

export function calculateEmbeddingSimilarity(
  embedding1: Record<string, number>,
  embedding2: Record<string, number>
): number {
  const array1 = jsonbToArray(embedding1);
  const array2 = jsonbToArray(embedding2);

  return cosineSimilarity(array1, array2);
}

export function isGoodTeachingMatch(
  teachingSkillEmbedding: Record<string, number>,
  learningSkillEmbedding: Record<string, number>,
  threshold: number = 0.8
): boolean {
  const similarity = calculateEmbeddingSimilarity(
    teachingSkillEmbedding,
    learningSkillEmbedding
  );
  return similarity >= threshold;
}
