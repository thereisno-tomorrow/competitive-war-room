export interface LLMProvider {
  synthesize(prompt: string, context: Record<string, unknown>): Promise<string>;
  classify(content: string, categories: string[]): Promise<string>;
  classifyStructured<T>(prompt: string): Promise<T>;
  generateStructured<T>(prompt: string, context: Record<string, unknown>, options?: { fast?: boolean }): Promise<T>;
}
