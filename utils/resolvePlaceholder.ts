import { CustomWorld } from "./CustomWorld";
import {
  RandomAlphabets,
  RandomEmail,
  RandomNumbers,
  RandomString,
  ResolveDate,
} from "../test-data/ResolveDynamicData";

export function resolvePlaceholder(value: string, world: CustomWorld): string {
  if (value === "<RandomEmail>") return RandomEmail();
  if (value === "<RandomAlphabets>") return RandomAlphabets();
  if (value === "<RandomNumbers>") return RandomNumbers();
  if (value === "<RandomString>") return RandomString();
  if (value.includes("<Today")) return ResolveDate(value);
  if (value.startsWith("<this.")) {
    const fieldName = value.slice(6, -1);
    return String(
      (world as unknown as Record<string, unknown>)[fieldName] ?? "",
    );
  }
  return value;
}
