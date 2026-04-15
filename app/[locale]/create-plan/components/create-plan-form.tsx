"use client";

import AnimatedFormBox from "@/components/animated-form-box";
import { motion, AnimatePresence } from "motion/react";
import { useState, useActionState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, RepeatIcon, CheckIcon } from "@phosphor-icons/react";
import { createPlan } from "@/app/actions/plans";
import MotionLoader from "@/components/motion-loader";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type StepData = {
    id: string;
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
    order: number;
};

type StepGroupData = {
    id: string;
    order: number;
    repetitions: number;
    steps: StepData[];
};

type PlanItem =
    | { type: "step"; data: StepData }
    | { type: "group"; data: StepGroupData };

export default function CreatePlanForm() {
    const t = useTranslations("CreatePlanPage.form");
    const tSuccess = useTranslations("CreatePlanPage.success");
    const [title, setTitle] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [planItems, setPlanItems] = useState<PlanItem[]>([]);
    const [nextOrder, setNextOrder] = useState(0);
    const [state, action, pending] = useActionState(createPlan, undefined);

    // Add a standalone step
    const addStep = () => {
        const newStep: StepData = {
            id: crypto.randomUUID(),
            title: "",
            hours: 0,
            minutes: 0,
            seconds: 0,
            order: nextOrder,
        };
        setPlanItems([...planItems, { type: "step", data: newStep }]);
        setNextOrder(nextOrder + 1);
    };

    // Add a step group with one step
    const addStepGroup = () => {
        const newGroup: StepGroupData = {
            id: crypto.randomUUID(),
            order: nextOrder,
            repetitions: 1,
            steps: [{
                id: crypto.randomUUID(),
                title: "",
                hours: 0,
                minutes: 0,
                seconds: 0,
                order: 0,
            }],
        };
        setPlanItems([...planItems, { type: "group", data: newGroup }]);
        setNextOrder(nextOrder + 1);
    };

    // Add a step to a specific group
    const addStepToGroup = (groupId: string) => {
        setPlanItems(planItems.map(item => {
            if (item.type === "group" && item.data.id === groupId) {
                const newStep: StepData = {
                    id: crypto.randomUUID(),
                    title: "",
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    order: item.data.steps.length,
                };
                return {
                    ...item,
                    data: {
                        ...item.data,
                        steps: [...item.data.steps, newStep],
                    },
                };
            }
            return item;
        }));
    };

    // Update step data
    const updateStep = (stepId: string, field: keyof StepData, value: string | number) => {
        setPlanItems(planItems.map(item => {
            if (item.type === "step" && item.data.id === stepId) {
                return {
                    ...item,
                    data: { ...item.data, [field]: value },
                };
            } else if (item.type === "group") {
                const updatedSteps = item.data.steps.map(step =>
                    step.id === stepId ? { ...step, [field]: value } : step
                );
                return {
                    ...item,
                    data: { ...item.data, steps: updatedSteps },
                };
            }
            return item;
        }));
    };

    // Update group repetitions
    const updateGroupRepetitions = (groupId: string, repetitions: number) => {
        setPlanItems(planItems.map(item => {
            if (item.type === "group" && item.data.id === groupId) {
                return {
                    ...item,
                    data: { ...item.data, repetitions: Math.max(1, repetitions) },
                };
            }
            return item;
        }));
    };

    // Remove a step or group
    const removeItem = (itemId: string, isGroup: boolean = false) => {
        setPlanItems(planItems.filter(item => {
            if (isGroup) {
                return !(item.type === "group" && item.data.id === itemId);
            }
            return !(item.type === "step" && item.data.id === itemId);
        }));
    };

    // Remove a step from a group
    const removeStepFromGroup = (groupId: string, stepId: string) => {
        setPlanItems(planItems.map(item => {
            if (item.type === "group" && item.data.id === groupId) {
                const updatedSteps = item.data.steps.filter(step => step.id !== stepId);
                // Remove group if no steps left
                if (updatedSteps.length === 0) {
                    return null;
                }
                return {
                    ...item,
                    data: {
                        ...item.data,
                        steps: updatedSteps.map((step, idx) => ({ ...step, order: idx })),
                    },
                };
            }
            return item;
        }).filter(Boolean) as PlanItem[]);
    };

    // Move item up or down
    const moveItem = (index: number, direction: "up" | "down") => {
        if (
            (direction === "up" && index === 0) ||
            (direction === "down" && index === planItems.length - 1)
        ) {
            return;
        }

        const newItems = [...planItems];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];

        // Update order values
        newItems.forEach((item, idx) => {
            if (item.type === "step") {
                item.data.order = idx;
            } else {
                item.data.order = idx;
            }
        });

        setPlanItems(newItems);
    };

    // Calculate total duration
    const calculateTotalDuration = () => {
        let totalSeconds = 0;
        planItems.forEach(item => {
            if (item.type === "step") {
                const { hours, minutes, seconds } = item.data;
                totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
            } else {
                const groupSeconds = item.data.steps.reduce((sum, step) => {
                    return sum + (step.hours * 3600) + (step.minutes * 60) + step.seconds;
                }, 0);
                totalSeconds += groupSeconds * item.data.repetitions;
            }
        });

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return { hours, minutes, seconds };
    };

    const duration = calculateTotalDuration();

    // Show success card if plan was created
    if (state?.success) {
        return (
            <AnimatedFormBox name="form-container">
                <div className="space-y-6 text-center">
                    <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckIcon size={32} weight="bold" className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold">{tSuccess("title")}</h2>
                        <p className="text-muted-foreground">
                            {tSuccess("description")}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <Button asChild size="lg" className="w-full">
                            <Link href={{
                                pathname: '/plans/[plan_id]',
                                params: { plan_id: state.planId ?? "" }
                            }}>{tSuccess("goToPlan")}</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full">
                            <Link href="/plans/me">{tSuccess("viewMyPlans")}</Link>
                        </Button>
                    </div>
                </div>
            </AnimatedFormBox>
        );
    }

    return (<AnimatedFormBox name="form-container">
        <form action={action} className="space-y-6">
            {state?.message && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {state.message}
                </div>
            )}

            {/* Hidden inputs for data serialization */}
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="isPublic" value={isPublic.toString()} />
            <input type="hidden" name="planItems" value={JSON.stringify(planItems)} />

            {/* Plan Details */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">{t("planTitle")}</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("planTitlePlaceholder")}
                        required
                        minLength={1}
                        maxLength={200}
                        aria-invalid={!!state?.errors?.title}
                    />
                    {state?.errors?.title && (
                        <p className="text-xs text-destructive">{state.errors.title[0]}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="size-4 accent-primary"
                    />
                    <Label htmlFor="isPublic" className="cursor-pointer">
                        {t("makePublic")}
                    </Label>
                </div>
            </div>

            {/* Steps and Groups */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{t("stepsHeading")}</h3>
                    <Badge variant="secondary">
                        {t("totalLabel")} {duration.hours}h {duration.minutes}m {duration.seconds}s
                    </Badge>
                </div>

                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {planItems.map((item, index) => (
                            <motion.div
                                key={item.type === "step" ? item.data.id : item.data.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -100 }}
                                transition={{
                                    layout: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                    scale: { duration: 0.2 },
                                }}
                                className="space-y-2"
                            >
                                {item.type === "step" ? (
                                    <StepRow
                                        step={item.data}
                                        index={index}
                                        totalItems={planItems.length}
                                        onUpdate={updateStep}
                                        onRemove={() => removeItem(item.data.id, false)}
                                        onMove={moveItem}
                                    />
                                ) : (
                                    <StepGroupRow
                                        group={item.data}
                                        index={index}
                                        totalItems={planItems.length}
                                        onUpdateStep={updateStep}
                                        onUpdateRepetitions={updateGroupRepetitions}
                                        onRemoveStep={removeStepFromGroup}
                                        onRemoveGroup={() => removeItem(item.data.id, true)}
                                        onAddStep={addStepToGroup}
                                        onMove={moveItem}
                                    />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="flex gap-2">
                    <Button type="button" onClick={addStep} variant="outline" size="sm">
                        <PlusIcon weight="bold" />
                        {t("addStep")}
                    </Button>
                    <Button type="button" onClick={addStepGroup} variant="outline" size="sm">
                        <RepeatIcon weight="bold" />
                        {t("addRepeatingGroup")}
                    </Button>
                </div>

                {state?.errors?.steps && (
                    <p className="text-sm text-destructive">{state.errors.steps[0]}</p>
                )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={!title || planItems.length === 0 || pending}>
                <MotionLoader pending={pending} />
                {t("submitButton")}
            </Button>
        </form>
    </AnimatedFormBox>);
}

// Step row component
function StepRow({
    step,
    index,
    totalItems,
    onUpdate,
    onRemove,
    onMove,
}: {
    step: StepData;
    index: number;
    totalItems: number;
    onUpdate: (stepId: string, field: keyof StepData, value: string | number) => void;
    onRemove: () => void;
    onMove: (index: number, direction: "up" | "down") => void;
}) {
    const t = useTranslations("CreatePlanPage.form");
    return (
        <div className="flex gap-2 items-start p-3 bg-background rounded-md border">
            <div className="flex-1 space-y-2">
                <Input
                    value={step.title}
                    onChange={(e) => onUpdate(step.id, "title", e.target.value)}
                    placeholder={t("stepTitlePlaceholder")}
                    required
                    minLength={1}
                    maxLength={200}
                />
                <div className="flex gap-2">
                    <div className="flex gap-0.5">
                        <Input
                            type="number"
                            min="0"
                            max="99"
                            value={step.hours}
                            onChange={(e) => onUpdate(step.id, "hours", parseInt(e.target.value) || 0)}
                            placeholder={t("hoursPlaceholder")}
                            className="w-20"
                        />
                        <Label>{t("hoursLabel")}</Label>
                    </div>
                    <div className="flex gap-0.5">
                        <Input
                            type="number"
                            min="0"
                            max="59"
                            value={step.minutes}
                            onChange={(e) => onUpdate(step.id, "minutes", Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                            placeholder={t("minutesPlaceholder")}
                            className="w-20"
                        />
                        <Label>{t("minutesLabel")}</Label>
                    </div>
                    <div className="flex gap-0.5">
                        <Input
                            type="number"
                            min="0"
                            max="59"
                            value={step.seconds}
                            onChange={(e) => onUpdate(step.id, "seconds", Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                            placeholder={t("secondsPlaceholder")}
                            className="w-20"
                        />
                        <Label>{t("secondsLabel")}</Label>
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onMove(index, "up")}
                    disabled={index === 0}
                >
                    <ArrowUpIcon weight="bold" />
                </Button>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onMove(index, "down")}
                    disabled={index === totalItems - 1}
                >
                    <ArrowDownIcon weight="bold" />
                </Button>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={onRemove}
                >
                    <TrashIcon weight="bold" />
                </Button>
            </div>
        </div>
    );
}

// Step group row component
function StepGroupRow({
    group,
    index,
    totalItems,
    onUpdateStep,
    onUpdateRepetitions,
    onRemoveStep,
    onRemoveGroup,
    onAddStep,
    onMove,
}: {
    group: StepGroupData;
    index: number;
    totalItems: number;
    onUpdateStep: (stepId: string, field: keyof StepData, value: string | number) => void;
    onUpdateRepetitions: (groupId: string, repetitions: number) => void;
    onRemoveStep: (groupId: string, stepId: string) => void;
    onRemoveGroup: () => void;
    onAddStep: (groupId: string) => void;
    onMove: (index: number, direction: "up" | "down") => void;
}) {
    const t = useTranslations("CreatePlanPage.form");
    return (
        <div className="border-2 border-dashed border-foreground/30 rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <RepeatIcon weight="bold" className="text-foreground/70" />
                    <span className="text-sm font-medium">{t("repeatLabel")}</span>
                    <Input
                        type="number"
                        min="1"
                        max="999"
                        value={group.repetitions}
                        onChange={(e) => onUpdateRepetitions(group.id, parseInt(e.target.value) || 1)}
                        className="w-16"
                        required
                    />
                    <span className="text-sm">{t("timesLabel")}</span>
                </div>
                <div className="flex gap-1">
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onMove(index, "up")}
                        disabled={index === 0}
                    >
                        <ArrowUpIcon weight="bold" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => onMove(index, "down")}
                        disabled={index === totalItems - 1}
                    >
                        <ArrowDownIcon weight="bold" />
                    </Button>
                    <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={onRemoveGroup}
                    >
                        <TrashIcon weight="bold" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2 ps-4">
                <AnimatePresence mode="popLayout">
                    {group.steps.map((step) => (
                        <motion.div
                            key={step.id}
                            layout
                            initial={{ opacity: 0, height: 0, scale: 0.8 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.8, x: -50 }}
                            transition={{
                                layout: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                                height: { duration: 0.2 },
                            }}
                            className="flex gap-2 items-start p-2 bg-background rounded-md"
                        >
                            <div className="flex-1 space-y-2">
                                <Input
                                    value={step.title}
                                    onChange={(e) => onUpdateStep(step.id, "title", e.target.value)}
                                    placeholder={t("stepTitlePlaceholder")}
                                    required
                                    minLength={1}
                                    maxLength={200}
                                />
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={step.hours}
                                        onChange={(e) => onUpdateStep(step.id, "hours", parseInt(e.target.value) || 0)}
                                        placeholder={t("hoursPlaceholder")}
                                        className="w-20"
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={step.minutes}
                                        onChange={(e) => onUpdateStep(step.id, "minutes", parseInt(e.target.value) || 0)}
                                        placeholder={t("minutesPlaceholder")}
                                        className="w-20"
                                    />
                                    <Input
                                        type="number"
                                        min="0"
                                        max="59"
                                        value={step.seconds}
                                        onChange={(e) => onUpdateStep(step.id, "seconds", parseInt(e.target.value) || 0)}
                                        placeholder={t("secondsPlaceholder")}
                                        className="w-20"
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => onRemoveStep(group.id, step.id)}
                                disabled={group.steps.length === 1}
                            >
                                <TrashIcon weight="bold" />
                            </Button>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <Button
                    type="button"
                    onClick={() => onAddStep(group.id)}
                    variant="outline"
                    size="sm"
                >
                    <PlusIcon weight="bold" />
                    {t("addStepToGroup")}
                </Button>
            </div>
        </div>
    );
}