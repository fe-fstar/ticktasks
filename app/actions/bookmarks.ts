"use server";

import { db } from "@/db";
import { bookmarks, plans, steps, stepGroups } from "@/db/schema";
import { getUser } from "@/lib/dal";
import { eq, and, or, desc, sql } from "drizzle-orm";

export type BookmarkResult = {
  success: boolean;
  message?: string;
  isBookmarked?: boolean;
};

/**
 * Toggles bookmark for a plan. If bookmarked, removes it. If not bookmarked, adds it.
 * Users can bookmark:
 * - Their own plans (regardless of public/private status)
 * - Other users' public plans only
 */
export async function toggleBookmark(planId: string): Promise<BookmarkResult> {
  const user = await getUser();
  
  if (!user) {
    return {
      success: false,
      message: "You must be logged in to bookmark plans",
    };
  }

  try {
    // Check if the plan exists and get its details
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!plan) {
      return {
        success: false,
        message: "Plan not found",
      };
    }

    // Check if user can bookmark this plan
    const canBookmark = plan.userId === user.id || plan.isPublic;
    
    if (!canBookmark) {
      return {
        success: false,
        message: "You cannot bookmark private plans from other users",
      };
    }

    // Check if bookmark already exists
    const [existingBookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, user.id),
          eq(bookmarks.planId, planId)
        )
      )
      .limit(1);

    if (existingBookmark) {
      // Remove bookmark
      await db
        .delete(bookmarks)
        .where(eq(bookmarks.id, existingBookmark.id));

      return {
        success: true,
        message: "Bookmark removed",
        isBookmarked: false,
      };
    } else {
      // Add bookmark
      await db.insert(bookmarks).values({
        userId: user.id,
        planId: planId,
      });

      return {
        success: true,
        message: "Bookmark added",
        isBookmarked: true,
      };
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return {
      success: false,
      message: "Failed to toggle bookmark",
    };
  }
}

/**
 * Gets all bookmarks for the current user.
 * Returns only:
 * - User's own plans (regardless of public/private status)
 * - Other users' public plans
 * 
 * This ensures that when a plan becomes private, it automatically
 * hides from other users' bookmarks without deleting the bookmark record.
 */
export async function getBookmarks() {
  const user = await getUser();
  
  if (!user) {
    return {
      success: false,
      message: "You must be logged in to view bookmarks",
      bookmarks: [],
    };
  }

  try {
    const userBookmarks = await db
      .select({
        id: bookmarks.id,
        planId: plans.id,
        planTitle: plans.title,
        planUserId: plans.userId,
        isPublic: plans.isPublic,
        createdAt: bookmarks.createdAt,
        updatedAt: plans.updatedAt,
      })
      .from(bookmarks)
      .innerJoin(plans, eq(bookmarks.planId, plans.id))
      .where(
        and(
          eq(bookmarks.userId, user.id),
          // Show only: user's own plans OR public plans
          or(
            eq(plans.userId, user.id),
            eq(plans.isPublic, true)
          )
        )
      )
      .orderBy(bookmarks.createdAt);

    return {
      success: true,
      bookmarks: userBookmarks,
    };
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return {
      success: false,
      message: "Failed to fetch bookmarks",
      bookmarks: [],
    };
  }
}

/**
 * Checks if the current user has bookmarked a specific plan.
 * This is optimized for single plan checks (e.g., showing bookmark button state).
 */
export async function isBookmarked(planId: string): Promise<boolean> {
  const user = await getUser();
  
  if (!user) {
    return false;
  }

  try {
    const [bookmark] = await db
      .select({ id: bookmarks.id })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, user.id),
          eq(bookmarks.planId, planId)
        )
      )
      .limit(1);

    return !!bookmark;
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    return false;
  }
}

/**
 * Checks bookmark status for multiple plans at once.
 * Returns a Map of planId -> isBookmarked for efficient lookup.
 * This is optimized for batch checks (e.g., showing bookmark status in a list).
 */
export async function getBookmarkStatusForPlans(
  planIds: string[]
): Promise<Map<string, boolean>> {
  const user = await getUser();
  const statusMap = new Map<string, boolean>();
  
  // Initialize all as not bookmarked
  planIds.forEach(id => statusMap.set(id, false));
  
  if (!user || planIds.length === 0) {
    return statusMap;
  }

  try {
    const { inArray } = await import("drizzle-orm");
    
    const bookmarkedPlans = await db
      .select({ planId: bookmarks.planId })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, user.id),
          inArray(bookmarks.planId, planIds)
        )
      );

    // Update map with bookmarked status
    bookmarkedPlans.forEach(({ planId }) => {
      statusMap.set(planId, true);
    });

    return statusMap;
  } catch (error) {
    console.error("Error checking bookmark status for plans:", error);
    return statusMap;
  }
}

/**
 * Gets paginated bookmarked plans for the current user with search support.
 * Returns only:
 * - User's own plans (regardless of public/private status)
 * - Other users' public plans
 * 
 * Includes plan duration calculated from steps and supports fuzzy search.
 */
export async function getUserBookmarkedPlansWithDetails(
  page: number = 1,
  pageSize: number = 10,
  searchTerm: string = ""
) {
  const user = await getUser();
  if (!user) {
    return {
      plans: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  try {
    const offset = (page - 1) * pageSize;

    // Build where conditions
    const whereConditions = [
      eq(bookmarks.userId, user.id),
      // Show only: user's own plans OR public plans
      or(
        eq(plans.userId, user.id),
        eq(plans.isPublic, true)
      ),
    ];
    
    // Add fuzzy search using pg_trgm with explicit similarity threshold
    if (searchTerm.trim()) {
      whereConditions.push(
        sql`similarity(${plans.title}, ${searchTerm.trim()}) > 0.2`
      );
    }

    // Fetch bookmarked plans with duration in a single query
    // Uses COUNT(*) OVER() for total count and LEFT JOINs to calculate duration
    const baseQuery = db
      .select({
        id: plans.id,
        userId: plans.userId,
        title: plans.title,
        isPublic: plans.isPublic,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
        isBookmarked: sql<boolean>`true`,
        totalSeconds: sql<number>`
          COALESCE(
            SUM(
              (COALESCE(${steps.hours}, 0) * 3600 + 
               COALESCE(${steps.minutes}, 0) * 60 + 
               COALESCE(${steps.seconds}, 0)) * 
              COALESCE(${stepGroups.repetitions}, 1)
            ),
            0
          )::int
        `,
        totalCount: sql<number>`COUNT(*) OVER()::int`,
      })
      .from(bookmarks)
      .innerJoin(plans, eq(bookmarks.planId, plans.id))
      .leftJoin(
        steps,
        eq(steps.planId, plans.id)
      )
      .leftJoin(
        stepGroups,
        eq(stepGroups.id, steps.stepGroupId)
      )
      .where(and(...whereConditions))
      .groupBy(plans.id, bookmarks.id);

    // Add ordering - if search term exists, order by similarity, otherwise by bookmark created date
    const results = await (searchTerm.trim()
      ? baseQuery
          .orderBy(
            sql`similarity(${plans.title}, ${searchTerm.trim()}) DESC`,
            desc(bookmarks.createdAt)
          )
          .limit(pageSize)
          .offset(offset)
      : baseQuery
          .orderBy(desc(bookmarks.createdAt))
          .limit(pageSize)
          .offset(offset));

    // Get total from first result (COUNT(*) OVER() returns same count for all rows)
    const total = results.length > 0 ? results[0].totalCount : 0;
    const totalPages = Math.ceil(total / pageSize);

    // Convert totalSeconds to hours/minutes/seconds format
    const plansWithDuration = results.map((plan) => {
      const totalSeconds = plan.totalSeconds;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return {
        id: plan.id,
        userId: plan.userId,
        title: plan.title,
        isPublic: plan.isPublic,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        isBookmarked: plan.isBookmarked,
        duration: { hours, minutes, seconds },
      };
    });

    return {
      plans: plansWithDuration,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Failed to get user bookmarked plans:", error);
    return {
      plans: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

