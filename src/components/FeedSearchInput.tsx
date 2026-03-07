import { useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type SetStateAction, useRef } from "react";
import {
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import { prefetchFeed } from "@/lib/feed";
import { useRecentValidations } from "@/lib/recent";
import { ProgressCircle } from "./ProgressCircle";

export function FeedSearchInput({
  url,
  setURL,
  error,
  loading,
  onSubmit,
}: {
  url: string;
  setURL: Dispatch<SetStateAction<string>>;
  error?: string;
  loading?: boolean;
  onSubmit: () => Promise<void>;
}) {
  const client = useQueryClient();
  const onHover = (prefetchURL: string) => prefetchFeed(client, prefetchURL);

  const allFeedInfos = useRecentValidations();
  const filteredFeedInfos = allFeedInfos.filter((item) => {
    const urlLower = url.toLocaleLowerCase().trim();
    const itemURLLower = item.url.toLocaleLowerCase().trim();
    const itemTitleLower = item.title?.toLocaleLowerCase().trim();
    if (urlLower === itemURLLower) return false;
    if (itemURLLower.includes(urlLower)) return true;
    if (itemTitleLower?.includes(urlLower)) return true;
    return false;
  });
  const trigger = useRef(null);

  return (
    <ComboBox
      allowsCustomValue
      allowsEmptyCollection
      menuTrigger="focus"
      inputValue={url}
      onInputChange={setURL}
      aria-label="Feed URL"
      items={filteredFeedInfos}
      autoFocus
    >
      <div
        ref={trigger}
        className="flex w-[375px] items-center gap-2 border-2 border-amber-950 bg-amber-50/70 px-3 py-2 text-amber-950 text-xl sm:w-[400px] md:w-[500px] lg:w-[600px]"
      >
        <Input
          type="url"
          placeholder="Enter feed URL"
          className="grow truncate outline-none placeholder:text-amber-950/60 focus:outline-none"
          required
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            (window.document.activeElement as HTMLInputElement).blur();
            onSubmit();
          }}
        />
        {error && (
          <div className="flex items-center gap-2 font-medium text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex size-7 items-center justify-center">
            <ProgressCircle size={24} />
          </div>
        )}
      </div>
      <Popover placement="bottom" triggerRef={trigger}>
        {filteredFeedInfos.length > 0 && (
          <div className="flex w-[375px] flex-col items-center border-2 border-amber-950 text-amber-950 text-xl shadow-lg sm:w-[400px] md:w-[500px] lg:w-[600px]">
            <div className="flex w-full grow items-center gap-2 bg-amber-50/70 px-3 py-0.5">
              <div className="h-[1.5px] w-7 flex-none bg-amber-950" />
              <span className="flex-none text-sm">Recent validations</span>
              <div className="h-[1.5px] grow bg-amber-950" />
            </div>
            <ListBox items={filteredFeedInfos} className="w-full">
              {(info) => (
                <ListBoxItem
                  onMouseOver={() => onHover(info.url)}
                  id={info.url}
                  key={info.url}
                  onAction={() => {
                    setURL(info.url);
                    (window.document.activeElement as HTMLInputElement).blur();
                    onSubmit();
                  }}
                  className="flex w-full grow cursor-pointer items-center gap-2 bg-amber-50/70 px-3 py-2 focus:bg-amber-50"
                  textValue={info.title}
                >
                  <img
                    src={info.image}
                    alt="Feed artwork"
                    className="size-7 object-cover object-center sepia-[0.7]"
                    loading="lazy"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="line-clamp-1 font-medium text-sm leading-tight">
                      {info.title}
                    </span>
                    <span className="line-clamp-1 font-light text-xs leading-tight">
                      {info.url}
                    </span>
                  </div>
                </ListBoxItem>
              )}
            </ListBox>
          </div>
        )}
      </Popover>
    </ComboBox>
  );
}
