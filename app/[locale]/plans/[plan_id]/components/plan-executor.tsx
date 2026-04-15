"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useWebHaptics } from "web-haptics/react";
import { useTranslations } from "next-intl";

type Step = {
  id: string;
  title: string;
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
  stepGroupId: string | null;
  order: number;
};

type StepGroup = {
  id: string;
  repetitions: number;
  order: number;
};

type Plan = {
  id: string;
  title: string;
  steps: Step[];
  stepGroups: StepGroup[];
};

type ExecutionStep = {
  id: string;
  title: string;
  durationSeconds: number;
  isFromGroup?: boolean;
  groupRepetition?: number;
};

type PlanState = "preview" | "in-progress" | "completed";

type StepTiming = {
  start: number;
  end: number;
  warned: boolean;
};

interface PlanExecutorProps {
  plan: Plan;
  isAuthenticated: boolean;
}

export function PlanExecutor({ plan, isAuthenticated }: PlanExecutorProps) {
  const t = useTranslations("PlanExecutor");
  const { trigger } = useWebHaptics();
  const [planState, setPlanState] = useState<PlanState>("preview");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [stepTiming, setStepTiming] = useState<StepTiming | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickingSoundRef = useRef<HTMLAudioElement | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Function to request a screen wake lock
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
        });
        console.log('Screen Wake Lock acquired');
      }
    } catch (err) {
      console.error(`Wake Lock error: ${err}`);
    }
  };

  // Function to release the screen wake lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.error(`Wake Lock release error: ${err}`);
      }
    }
  };

  // Flatten all steps including group repetitions into execution order
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);

  // Initialize audio
  useEffect(() => {
    tickingSoundRef.current = new Audio('/audios/countdown.wav');
    tickingSoundRef.current.loop = true;
    return () => {
      if (tickingSoundRef.current) {
        tickingSoundRef.current.pause();
        tickingSoundRef.current = null;
      }
    };
  }, []);

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    const steps: ExecutionStep[] = [];

    // Get standalone steps and groups, sorted by order
    const stepsInGroups = plan.steps.filter((step) => step.stepGroupId !== null);
    const standaloneSteps = plan.steps.filter((step) => step.stepGroupId === null);

    const items = [...standaloneSteps, ...plan.stepGroups].sort(
      (a, b) => a.order - b.order
    );

    items.forEach((item) => {
      if ("stepGroupId" in item) {
        // Standalone step
        const step = item;
        const durationSeconds =
          (step.hours || 0) * 3600 +
          (step.minutes || 0) * 60 +
          (step.seconds || 0);
        steps.push({
          id: step.id,
          title: step.title,
          durationSeconds,
        });
      } else {
        // Step group - repeat all steps in group
        const group = item;
        const groupSteps = stepsInGroups
          .filter((s) => s.stepGroupId === group.id)
          .sort((a, b) => a.order - b.order);

        for (let rep = 0; rep < group.repetitions; rep++) {
          groupSteps.forEach((step) => {
            const durationSeconds =
              (step.hours || 0) * 3600 +
              (step.minutes || 0) * 60 +
              (step.seconds || 0);
            steps.push({
              id: `${step.id}-rep${rep}`,
              title: step.title,
              durationSeconds,
              isFromGroup: true,
              groupRepetition: rep + 1,
            });
          });
        }
      }
    });

    setExecutionSteps(steps);
  }, [plan]);

  // Timer logic - timestamp-based for better background handling
  useEffect(() => {
    if (
      planState === "in-progress" &&
      !isPaused &&
      executionSteps.length > 0 &&
      currentStepIndex < executionSteps.length
    ) {
      const currentStep = executionSteps[currentStepIndex];

      // Initialize step timing when starting a new step
      if (currentStep.durationSeconds > 0 && !stepTiming) {
        const now = Date.now();
        setStepTiming({
          start: now,
          end: now + currentStep.durationSeconds * 1000,
          warned: false,
        });
        setRemainingSeconds(currentStep.durationSeconds);
      }

      // Main timer loop - runs frequently for better responsiveness
      if (currentStep.durationSeconds > 0 && stepTiming) {
        timerRef.current = setInterval(() => {
          const now = Date.now();
          const remaining = stepTiming.end - now;
          const remainingSec = Math.max(0, Math.ceil(remaining / 1000));

          // Update UI
          setRemainingSeconds(remainingSec);

          // 🔔 Play ticking sound at last 4 seconds
          if (!stepTiming.warned && remaining <= 4000 && remaining > 0) {
            if (tickingSoundRef.current) {
              tickingSoundRef.current.play().catch(() => {
                // Audio play failed (autoplay policy), ignore
              });
            }
            trigger("buzz");
            setStepTiming(prev => prev ? { ...prev, warned: true } : prev);
          }

          // ⏱ Step finished
          if (remaining <= 0) {
            if (tickingSoundRef.current) {
              tickingSoundRef.current.pause();
              tickingSoundRef.current.currentTime = 0;
            }
            clearInterval(timerRef.current!);
            handleNextStep();
          }
        }, 100); // Run every 100ms for smooth updates

        return () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        };
      }
    }
  }, [planState, isPaused, currentStepIndex, stepTiming, executionSteps]);

  // Handle visibility changes to recalculate timing when tab becomes active
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Reacquire wake lock if plan is in progress and lock was released
        if (planState === "in-progress" && (!wakeLockRef.current || wakeLockRef.current.released)) {
          requestWakeLock();
        }

        if (stepTiming && !isPaused) {
          // Recalculate remaining time based on timestamp
          const now = Date.now();
          const remaining = stepTiming.end - now;
          const remainingSec = Math.max(0, Math.ceil(remaining / 1000));
          setRemainingSeconds(remainingSec);

          // Check if we missed the warning window
          if (!stepTiming.warned && remaining <= 4000 && remaining > 0) {
            if (tickingSoundRef.current && tickingSoundRef.current.paused) {
              tickingSoundRef.current.play().catch(() => {});
            }
            trigger("buzz");
            setStepTiming(prev => prev ? { ...prev, warned: true } : prev);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [stepTiming, isPaused, trigger, planState]);

  useEffect(() => {
    if (planState !== "in-progress") return;

    // Warn before closing tab/window
    function beforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    // Handle browser back/forward buttons
    function handlePopState(e: PopStateEvent) {
      const confirmed = window.confirm(
        "You have a plan in progress. Are you sure you want to leave? Your progress will be lost."
      );
      
      if (!confirmed) {
        // Push the current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
      }
    }

    // Handle clicks on internal links
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && !anchor.target) {
        // Check if it's an internal link (same origin)
        try {
          const linkUrl = new URL(anchor.href);
          const currentUrl = new URL(window.location.href);
          
          if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
            const confirmed = window.confirm(
              "You have a plan in progress. Are you sure you want to leave? Your progress will be lost."
            );
            
            if (!confirmed) {
              e.preventDefault();
            }
          }
        } catch (err) {
          // Invalid URL, ignore
        }
      }
    }

    // Add an extra history entry to intercept back button
    window.history.pushState(null, "", window.location.href);
    
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [planState]);

  // Haptic feedback when moving to next step
  useEffect(() => {
    // Only trigger if plan is in progress and not on the initial step
    if (planState === "in-progress" && currentStepIndex > 0) {
      trigger("buzz");
    }
  }, [currentStepIndex, planState, trigger]);

  // Haptic feedback when plan is completed
  useEffect(() => {
    if (planState === "completed") {
      trigger("success");
    }
  }, [planState, trigger]);

  const handleBeginPlan = () => {
    setPlanState("in-progress");
    setCurrentStepIndex(0);
    setRemainingSeconds(0);
    setIsPaused(false);
    setStepTiming(null);
    requestWakeLock();
  };

  const handleNextStep = () => {
    // Stop ticking sound
    if (tickingSoundRef.current) {
      tickingSoundRef.current.pause();
      tickingSoundRef.current.currentTime = 0;
    }

    if (currentStepIndex < executionSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setRemainingSeconds(0);
      setIsPaused(false);
      setStepTiming(null);
    } else {
      // All steps completed
      setPlanState("completed");
      setRemainingSeconds(0);
      setStepTiming(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      releaseWakeLock();
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Stop ticking sound when paused
    if (tickingSoundRef.current) {
      tickingSoundRef.current.pause();
      tickingSoundRef.current.currentTime = 0;
    }
    // Store how much time was remaining when paused
    if (stepTiming) {
      pausedTimeRef.current = stepTiming.end - Date.now();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    // Recalculate end time based on paused duration
    if (stepTiming && pausedTimeRef.current > 0) {
      const now = Date.now();
      setStepTiming({
        start: now - (stepTiming.end - stepTiming.start - pausedTimeRef.current),
        end: now + pausedTimeRef.current,
        warned: stepTiming.warned,
      });
      pausedTimeRef.current = 0;
    }
  };

  const handleReplay = () => {
    setPlanState("preview");
    setCurrentStepIndex(0);
    setRemainingSeconds(0);
    setIsPaused(false);
    setStepTiming(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // Stop ticking sound
    if (tickingSoundRef.current) {
      tickingSoundRef.current.pause();
      tickingSoundRef.current.currentTime = 0;
    }
    releaseWakeLock();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.length > 0 ? parts.join(" ") : "0s";
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Calculate total duration
  const totalSeconds = executionSteps.reduce(
    (acc, step) => acc + step.durationSeconds,
    0
  );

  const currentStep =
    planState === "in-progress" && executionSteps.length > 0
      ? executionSteps[currentStepIndex]
      : null;

  // Preview state
  if (planState === "preview") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("preview.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {executionSteps.length === 0 ? (
            <p className="text-muted-foreground">{t("preview.noSteps")}</p>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {executionSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {index + 1}.
                      </span>
                      <p className="font-medium">
                        {step.title}
                        {step.isFromGroup && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({t("preview.repetition")} {step.groupRepetition})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {step.durationSeconds > 0
                        ? formatDuration(step.durationSeconds)
                        : t("preview.manual")}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {t("preview.totalDuration")} {formatDuration(totalSeconds)}
                </p>
                <Button onClick={handleBeginPlan} size="lg">
                  <PlayIcon className="me-2 size-5" weight="fill" />
                  {t("preview.beginButton")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // In-progress state
  if (planState === "in-progress" && currentStep) {
    const progress = ((currentStepIndex + 1) / executionSteps.length) * 100;

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t("inProgress.title")}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {t("inProgress.step", { current: currentStepIndex + 1, total: executionSteps.length })}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-6">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current step */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">
              {currentStep.title}
              {currentStep.isFromGroup && (
                <span className="text-lg text-muted-foreground ml-3">
                  ({t("inProgress.repetition", { current: currentStep.groupRepetition ?? 1 })})
                </span>
              )}
            </h3>

            {currentStep.durationSeconds > 0 && (
              <div className="text-center">
                <div
                  className={`text-6xl font-bold mb-4 ${remainingSeconds <= 10 && remainingSeconds > 0
                    ? "text-destructive animate-pulse"
                    : ""
                    }`}
                >
                  {formatTime(remainingSeconds)}
                </div>
                <div className="flex gap-3 justify-center">
                  {isPaused ? (
                    <Button onClick={handleResume} size="lg">
                      <PlayIcon className="me-2 size-5" weight="fill" />
                      {t("inProgress.resumeButton")}
                    </Button>
                  ) : (
                    <Button onClick={handlePause} size="lg" variant="outline">
                      <PauseIcon className="me-2 size-5" weight="fill" />
                      {t("inProgress.pauseButton")}
                    </Button>
                  )}
                  <Button onClick={handleNextStep} size="lg" variant="outline">
                    <SkipForwardIcon className="me-2 size-5" weight="fill" />
                    {t("inProgress.skipButton")}
                  </Button>
                </div>
              </div>
            )}

            {currentStep.durationSeconds === 0 && (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {t("inProgress.noDuration")}
                </p>
                <Button onClick={handleNextStep} size="lg">
                  <SkipForwardIcon className="me-2 size-5" weight="fill" />
                  {t("inProgress.nextStepButton")}
                </Button>
              </div>
            )}
          </div>

          {/* Upcoming steps */}
          {currentStepIndex < executionSteps.length - 1 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                {t("inProgress.nextSteps")}
              </h4>
              <div className="space-y-1">
                {executionSteps
                  .slice(currentStepIndex + 1, currentStepIndex + 4)
                  .map((step, index) => (
                    <div
                      key={step.id}
                      className="text-sm p-2 bg-muted/50 rounded flex justify-between items-center"
                    >
                      <span>
                        {currentStepIndex + index + 2}. {step.title}
                      </span>
                      <span className="text-muted-foreground">
                        {step.durationSeconds > 0
                          ? formatDuration(step.durationSeconds)
                          : t("preview.manual")}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Completed state
  if (planState === "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="size-6 text-green-500" weight="fill" />
            {t("completed.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t("completed.description", { count: executionSteps.length, title: plan.title })}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleReplay} size="lg">
              <ArrowCounterClockwiseIcon className="me-2 size-5" weight="bold" />
              {t("completed.replayButton")}
            </Button>
            {isAuthenticated ? (
              <Button asChild size="lg" variant="outline">
                <Link href="/plans/me">{t("completed.goToMyPlans")}</Link>
              </Button>
            ) : (
              <Button asChild size="lg" variant="outline">
                <Link href="/plans">{t("completed.viewOtherPlans")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
