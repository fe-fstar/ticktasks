"use client";

import { toggleBookmark } from "@/app/actions/bookmarks";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { BookmarkSimpleIcon } from "@phosphor-icons/react";
import { useTransition } from "react";

export function BookmarkToggleButton({
  planId,
  isBookmarked,
  setIsBookmarked,
}: {
  planId: string;
  isBookmarked: boolean;
  setIsBookmarked: (value: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    // Optimistic update - update UI immediately
    const optimistic = !isBookmarked;
    setIsBookmarked(optimistic);

    startTransition(async () => {
      const result = await toggleBookmark(planId);

      if (!result.success) {
        // Rollback on failure
        setIsBookmarked(!optimistic);
      }
    });
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        handleToggle();
      }}
      disabled={isPending}
    >
      <BookmarkSimpleIcon
        className="me-2 size-4"
        weight={isBookmarked ? "fill" : "regular"}
      />
      {isBookmarked ? "Remove bookmark" : "Bookmark"}
    </DropdownMenuItem>
  );
}
