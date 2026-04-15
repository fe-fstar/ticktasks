"use server";

import { db } from "@/db";
import { plans, steps, stepGroups, bookmarks } from "@/db/schema";
import { getUser } from "@/lib/dal";
import { eq, desc, and, sql, or } from "drizzle-orm";

type StepInput = {
  id: string;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  order: number;
};

type StepGroupInput = {
  id: string;
  order: number;
  repetitions: number;
  steps: StepInput[];
};

type PlanItemInput =
  | { type: "step"; data: StepInput }
  | { type: "group"; data: StepGroupInput };

export type CreatePlanFormState =
  | {
      errors?: {
        title?: string[];
        steps?: string[];
      };
      message?: string;
      success?: boolean;
      planId?: string;
    }
  | undefined;

export async function createPlan(
  state: CreatePlanFormState,
  formData: FormData
): Promise<CreatePlanFormState> {
  // 1. Check if user is authenticated
  const user = await getUser();
  if (!user) {
    return {
      message: "You must be logged in to create a plan",
    };
  }

  // 2. Get form data
  const title = formData.get("title") as string;
  const isPublic = formData.get("isPublic") === "true";
  const planItemsJson = formData.get("planItems") as string;

  // 3. Validate basic fields
  if (!title || title.trim().length === 0) {
    return {
      errors: {
        title: ["Plan title is required"],
      },
    };
  }

  if (title.length > 200) {
    return {
      errors: {
        title: ["Plan title must be less than 200 characters"],
      },
    };
  }

  let planItems: PlanItemInput[];
  try {
    planItems = JSON.parse(planItemsJson);
  } catch {
    return {
      message: "Invalid plan data",
    };
  }

  if (!planItems || planItems.length === 0) {
    return {
      errors: {
        steps: ["Plan must have at least one step"],
      },
    };
  }

  // 4. Validate steps
  for (const item of planItems) {
    if (item.type === "step") {
      if (!item.data.title || item.data.title.trim().length === 0) {
        return {
          errors: {
            steps: ["All steps must have a title"],
          },
        };
      }
    } else {
      for (const step of item.data.steps) {
        if (!step.title || step.title.trim().length === 0) {
          return {
            errors: {
              steps: ["All steps must have a title"],
            },
          };
        }
      }
    }
  }

  try {
    // 5. Create plan
    const [newPlan] = await db
      .insert(plans)
      .values({
        userId: user.id,
        title: title.trim(),
        isPublic,
      })
      .returning({ id: plans.id });

    // 6. Create step groups and steps
    for (const item of planItems) {
      if (item.type === "step") {
        // Create standalone step
        await db.insert(steps).values({
          planId: newPlan.id,
          stepGroupId: null,
          title: item.data.title.trim(),
          hours: item.data.hours,
          minutes: item.data.minutes,
          seconds: item.data.seconds,
          order: item.data.order,
        });
      } else {
        // Create step group
        const [newGroup] = await db
          .insert(stepGroups)
          .values({
            planId: newPlan.id,
            order: item.data.order,
            repetitions: item.data.repetitions,
          })
          .returning({ id: stepGroups.id });

        // Create steps in group
        for (const step of item.data.steps) {
          await db.insert(steps).values({
            planId: newPlan.id,
            stepGroupId: newGroup.id,
            title: step.title.trim(),
            hours: step.hours,
            minutes: step.minutes,
            seconds: step.seconds,
            order: step.order,
          });
        }
      }
    }

    // 7. Return success
    return {
      success: true,
      planId: newPlan.id,
    };
  } catch (error) {
    console.error("Failed to create plan:", error);
    return {
      message: "Failed to create plan. Please try again.",
    };
  }
}

export async function getUserPlans() {
  const user = await getUser();
  if (!user) {
    return [];
  }

  try {
    // Get all plans for the user
    const userPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, user.id))
      .orderBy(desc(plans.createdAt));

    // For each plan, get all steps to calculate total duration
    const plansWithDuration = await Promise.all(
      userPlans.map(async (plan) => {
        const planSteps = await db
          .select()
          .from(steps)
          .where(eq(steps.planId, plan.id));

        const planStepGroups = await db
          .select()
          .from(stepGroups)
          .where(eq(stepGroups.planId, plan.id));

        // Calculate total duration accounting for step group repetitions
        const totalSeconds = planSteps.reduce((acc, step) => {
          const stepDuration = (step.hours || 0) * 3600 + (step.minutes || 0) * 60 + (step.seconds || 0);
          
          // If step is in a group, multiply by repetitions
          if (step.stepGroupId) {
            const group = planStepGroups.find(g => g.id === step.stepGroupId);
            const repetitions = group?.repetitions || 1;
            return acc + (stepDuration * repetitions);
          }
          
          // Standalone step, add once
          return acc + stepDuration;
        }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return {
          ...plan,
          duration: { hours, minutes, seconds },
        };
      })
    );

    return plansWithDuration;
  } catch (error) {
    console.error("Failed to get user plans:", error);
    return [];
  }
}

/**
 * Gets user plans with bookmark status, pagination, and fuzzy search using pg_trgm.
 * Computes duration in SQL to avoid N+1 queries.
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param searchTerm - Optional search term for fuzzy matching on title
 * @returns Object with plans data, total count, and pagination info
 */
export async function getUserPlansWithBookmarkStatus(
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
    const whereConditions = [eq(plans.userId, user.id)];
    
    // Add fuzzy search using pg_trgm with explicit similarity threshold
    if (searchTerm.trim()) {
      whereConditions.push(
        sql`similarity(${plans.title}, ${searchTerm.trim()}) > 0.2`
      );
    }

    // Fetch plans with bookmark status and duration in a single query
    // Uses COUNT(*) OVER() for total count and LEFT JOINs to calculate duration
    const baseQuery = db
      .select({
        id: plans.id,
        userId: plans.userId,
        title: plans.title,
        isPublic: plans.isPublic,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
        isBookmarked: sql<boolean>`${bookmarks.id} IS NOT NULL`,
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
      .from(plans)
      .leftJoin(
        bookmarks,
        and(
          eq(bookmarks.planId, plans.id),
          eq(bookmarks.userId, user.id)
        )
      )
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

    // Add ordering - if search term exists, order by similarity, otherwise by created date
    const results = await (searchTerm.trim()
      ? baseQuery
          .orderBy(
            sql`similarity(${plans.title}, ${searchTerm.trim()}) DESC`,
            desc(plans.createdAt)
          )
          .limit(pageSize)
          .offset(offset)
      : baseQuery
          .orderBy(desc(plans.createdAt))
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
    console.error("Failed to get user plans with bookmark status:", error);
    return {
      plans: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Gets all public plans with bookmark status (if user is authenticated), pagination, and fuzzy search.
 * No authentication required to view, but bookmark status only shown for authenticated users.
 * @param page - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @param searchTerm - Optional search term for fuzzy matching on title
 * @returns Object with plans data, total count, and pagination info
 */
export async function getPublicPlansWithBookmarkStatus(
  page: number = 1,
  pageSize: number = 10,
  searchTerm: string = ""
) {
  // Get user if authenticated (optional)
  const user = await getUser();

  try {
    const offset = (page - 1) * pageSize;

    // Build where conditions - only public plans
    const whereConditions = [eq(plans.isPublic, true)];
    
    // Add fuzzy search using pg_trgm with explicit similarity threshold
    if (searchTerm.trim()) {
      whereConditions.push(
        sql`similarity(${plans.title}, ${searchTerm.trim()}) > 0.2`
      );
    }

    // Fetch plans with bookmark status (if user is authenticated) and duration in a single query
    const baseQuery = db
      .select({
        id: plans.id,
        userId: plans.userId,
        title: plans.title,
        isPublic: plans.isPublic,
        createdAt: plans.createdAt,
        updatedAt: plans.updatedAt,
        isBookmarked: user 
          ? sql<boolean>`${bookmarks.id} IS NOT NULL`
          : sql<boolean>`false`,
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
      .from(plans)
      .leftJoin(
        bookmarks,
        user
          ? and(
              eq(bookmarks.planId, plans.id),
              eq(bookmarks.userId, user.id)
            )
          : sql`false`
      )
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

    // Add ordering - if search term exists, order by similarity, otherwise by created date
    const results = await (searchTerm.trim()
      ? baseQuery
          .orderBy(
            sql`similarity(${plans.title}, ${searchTerm.trim()}) DESC`,
            desc(plans.createdAt)
          )
          .limit(pageSize)
          .offset(offset)
      : baseQuery
          .orderBy(desc(plans.createdAt))
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
      isAuthenticated: !!user,
    };
  } catch (error) {
    console.error("Failed to get public plans:", error);
    return {
      plans: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      isAuthenticated: false,
    };
  }
}

export async function deletePlan(planId: string) {
  const user = await getUser();
  if (!user) {
    return { success: false, message: "You must be logged in to delete a plan" };
  }

  try {
    // Verify the plan belongs to the user
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId));

    if (!plan) {
      return { success: false, message: "Plan not found" };
    }

    if (plan.userId !== user.id) {
      return { success: false, message: "You don't have permission to delete this plan" };
    }

    // Delete plan (cascade will handle steps and step groups)
    await db.delete(plans).where(eq(plans.id, planId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return { success: false, message: "Failed to delete plan. Please try again." };
  }
}

export async function getPlanById(planId: string) {
  try {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId));

    if (!plan) {
      return null;
    }

    // Get all steps and step groups
    const planSteps = await db
      .select()
      .from(steps)
      .where(eq(steps.planId, planId));

    const planStepGroups = await db
      .select()
      .from(stepGroups)
      .where(eq(stepGroups.planId, planId));

    return {
      ...plan,
      steps: planSteps,
      stepGroups: planStepGroups,
    };
  } catch (error) {
    console.error("Failed to get plan:", error);
    return null;
  }
}

export async function updatePlan(
  planId: string,
  state: CreatePlanFormState,
  formData: FormData
): Promise<CreatePlanFormState> {
  // 1. Check if user is authenticated
  const user = await getUser();
  if (!user) {
    return {
      message: "You must be logged in to update a plan",
    };
  }

  // 2. Verify the plan exists and belongs to the user
  const [existingPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId));

  if (!existingPlan) {
    return {
      message: "Plan not found",
    };
  }

  if (existingPlan.userId !== user.id) {
    return {
      message: "You don't have permission to update this plan",
    };
  }

  // 3. Get form data
  const title = formData.get("title") as string;
  const isPublic = formData.get("isPublic") === "true";
  const planItemsJson = formData.get("planItems") as string;

  // 4. Validate basic fields
  if (!title || title.trim().length === 0) {
    return {
      errors: {
        title: ["Plan title is required"],
      },
    };
  }

  if (title.length > 200) {
    return {
      errors: {
        title: ["Plan title must be less than 200 characters"],
      },
    };
  }

  let planItems: PlanItemInput[];
  try {
    planItems = JSON.parse(planItemsJson);
  } catch {
    return {
      message: "Invalid plan data",
    };
  }

  if (!planItems || planItems.length === 0) {
    return {
      errors: {
        steps: ["Plan must have at least one step"],
      },
    };
  }

  // 5. Validate steps
  for (const item of planItems) {
    if (item.type === "step") {
      if (!item.data.title || item.data.title.trim().length === 0) {
        return {
          errors: {
            steps: ["All steps must have a title"],
          },
        };
      }
    } else {
      for (const step of item.data.steps) {
        if (!step.title || step.title.trim().length === 0) {
          return {
            errors: {
              steps: ["All steps must have a title"],
            },
          };
        }
      }
    }
  }

  try {
    // 6. Delete existing steps and step groups (cascade will handle everything)
    await db.delete(stepGroups).where(eq(stepGroups.planId, planId));
    await db.delete(steps).where(eq(steps.planId, planId));

    // 7. Update plan
    await db
      .update(plans)
      .set({
        title: title.trim(),
        isPublic,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, planId));

    // 8. Create new step groups and steps
    for (const item of planItems) {
      if (item.type === "step") {
        // Create standalone step
        await db.insert(steps).values({
          planId: planId,
          stepGroupId: null,
          title: item.data.title.trim(),
          hours: item.data.hours,
          minutes: item.data.minutes,
          seconds: item.data.seconds,
          order: item.data.order,
        });
      } else {
        // Create step group
        const [newGroup] = await db
          .insert(stepGroups)
          .values({
            planId: planId,
            order: item.data.order,
            repetitions: item.data.repetitions,
          })
          .returning({ id: stepGroups.id });

        // Create steps in group
        for (const step of item.data.steps) {
          await db.insert(steps).values({
            planId: planId,
            stepGroupId: newGroup.id,
            title: step.title.trim(),
            hours: step.hours,
            minutes: step.minutes,
            seconds: step.seconds,
            order: step.order,
          });
        }
      }
    }

    // 9. Return success
    return {
      success: true,
      planId: planId,
    };
  } catch (error) {
    console.error("Failed to update plan:", error);
    return {
      message: "Failed to update plan. Please try again.",
    };
  }
}
