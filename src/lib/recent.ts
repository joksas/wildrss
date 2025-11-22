import { useLocalStorage } from "usehooks-ts";
import * as z from "zod";
import { WebURL } from "./url";

// Constants
export const FeedInfo = z.object({
  url: WebURL,
  title: z.string().trim().nonempty().optional().catch(undefined),
  author: z.string().trim().nonempty().optional().catch(undefined),
  image: WebURL.optional().catch(undefined),
  updated: z.iso.datetime(),
});
export type FeedInfo = z.infer<typeof FeedInfo>;
const VALIDATIONS_KEY = "validations";

export function useRecentValidations(): FeedInfo[] {
  const [value] = useLocalStorage<FeedInfo[]>(VALIDATIONS_KEY, []);
  return value;
}

export function useUpsertRecentValidation(): (info: FeedInfo) => void {
  const [, setValue] = useLocalStorage<FeedInfo[]>(VALIDATIONS_KEY, []);

  return (info: FeedInfo) => {
    setValue((prev) => {
      const index = prev.findIndex((item) => item.url === info.url);

      let next: FeedInfo[];
      if (index === -1) {
        // New entry
        next = [...prev, info];
      } else {
        // Update existing, but keep original URL
        next = prev.map((item, i) =>
          i === index ? { ...item, ...info, url: item.url } : item,
        );
      }

      // Sort by updated descending
      return next
        .slice()
        .sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated));
    });
  };
}
