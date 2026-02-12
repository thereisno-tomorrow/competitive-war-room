export interface LLMProvider {
  synthesize(prompt: string, context: Record<string, unknown>): Promise<string>;
  classify(content: string, categories: string[]): Promise<string>;
  generateStructured<T>(prompt: string, context: Record<string, unknown>): Promise<T>;
}
