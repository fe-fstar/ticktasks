"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MagnifyingGlassIcon, CaretLeftIcon, CaretRightIcon, PencilSimpleIcon, BookmarkSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { toggleBookmark } from "@/app/actions/bookmarks";
import { deletePlan } from "@/app/actions/plans";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MotionLoader from "@/components/motion-loader";
import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

type Plan = {
    id: string;
    title: string;
    isBookmarked: boolean;
    createdAt: Date;
    duration: {
        hours: number;
        minutes: number;
        seconds: number;
    };
};

type PlansTableProps = {
    initialPlans: Plan[];
    total: number;
    currentPage: number;
    totalPages: number;
    searchTerm: string;
};

export default function PlansTable({ 
    initialPlans, 
    total, 
    currentPage, 
    totalPages,
    searchTerm: initialSearchTerm
}: PlansTableProps) {
    const t = useTranslations("MyPlansPage.table");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [inputValue, setInputValue] = useState(initialSearchTerm);
    const [isPending, startTransition] = useTransition();
    const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<{ id: string; title: string } | null>(null);
    const locale = useLocale();
    
    // Initialize bookmark state from plans' isBookmarked property
    const [bookmarkStatus, setBookmarkStatus] = useState(() => {
        const map = new Map<string, boolean>();
        initialPlans.forEach(plan => map.set(plan.id, plan.isBookmarked));
        return map;
    });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue !== searchTerm) {
                handleSearch(inputValue);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue]);

    // Update input value when URL changes (e.g., back button)
    useEffect(() => {
        setInputValue(initialSearchTerm);
        setSearchTerm(initialSearchTerm);
    }, [initialSearchTerm]);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        const params = new URLSearchParams(searchParams);
        if (value.trim()) {
            params.set('search', value.trim());
        } else {
            params.delete('search');
        }
        params.delete('page'); // Reset to page 1 on new search
        
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    };

    const handleBookmarkToggle = async (planId: string) => {
        const currentStatus = bookmarkStatus.get(planId) ?? false;
        const optimisticStatus = !currentStatus;
        
        // Optimistic update
        setBookmarkStatus(prev => {
            const newMap = new Map(prev);
            newMap.set(planId, optimisticStatus);
            return newMap;
        });

        const result = await toggleBookmark(planId);
        
        if (!result.success) {
            // Rollback on failure
            setBookmarkStatus(prev => {
                const newMap = new Map(prev);
                newMap.set(planId, currentStatus);
                return newMap;
            });
        }
    };

    const handleDeleteClick = (planId: string, planTitle: string) => {
        setPlanToDelete({ id: planId, title: planTitle });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!planToDelete) return;
        
        setDeletingPlanId(planToDelete.id);
        const result = await deletePlan(planToDelete.id);

        if (result.success) {
            setDeleteDialogOpen(false);
            setPlanToDelete(null);
            setDeletingPlanId(null);
            router.refresh();
        } else {
            setDeletingPlanId(null);
        }
    };

    const startItem = total === 0 ? 0 : (currentPage - 1) * 10 + 1;
    const endItem = Math.min(currentPage * 10, total);

    return (
        <div className="w-full space-y-4">
            <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>
            
            {total === 0 && !initialSearchTerm ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                        {t("emptyState")}
                    </p>
                    <Button asChild>
                        <Link href="/create-plan">{t("emptyStateButton")}</Link>
                    </Button>
                </div>
            ) : total === 0 && initialSearchTerm ? (
                <div className="text-center py-12 border rounded-md">
                    <p className="text-muted-foreground">
                        {t("noResults", { searchTerm: initialSearchTerm })}
                    </p>
                </div>
            ) : (
                <>
                    <div className="w-full border rounded-md" style={{ opacity: isPending ? 0.6 : 1 }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("columns.title")}</TableHead>
                                    <TableHead>{t("columns.duration")}</TableHead>
                                    <TableHead>{t("columns.createdAt")}</TableHead>
                                    <TableHead className="text-right">{t("columns.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialPlans.map((plan) => (
                                    <TableRow key={plan.id} className="cursor-pointer">
                                        <TableCell>
                                            <Link
                                                href={{
                                                    pathname: '/plans/[plan_id]',
                                                    params: {plan_id: plan.id}
                                                }}
                                                className="block w-full h-full font-medium hover:underline"
                                            >
                                                {plan.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={{
                                                    pathname: '/plans/[plan_id]',
                                                    params: {plan_id: plan.id}
                                                }}
                                                className="block w-full h-full"
                                            >
                                                {plan.duration.hours > 0 && `${plan.duration.hours}h `}
                                                {plan.duration.minutes > 0 && `${plan.duration.minutes}m `}
                                                {plan.duration.seconds > 0 && `${plan.duration.seconds}s`}
                                                {plan.duration.hours === 0 &&
                                                    plan.duration.minutes === 0 &&
                                                    plan.duration.seconds === 0 &&
                                                    "0s"}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link
                                                href={{
                                                    pathname: '/plans/[plan_id]',
                                                    params: {plan_id: plan.id}
                                                }}
                                                className="block w-full h-full"
                                            >
                                                {new Date(plan.createdAt).toLocaleDateString(locale, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    asChild
                                                    className="h-8 w-8"
                                                >
                                                    <Link href={{
                                                        pathname: '/plans/[plan_id]/edit',
                                                        params: {plan_id: plan.id}
                                                    }}>
                                                        <PencilSimpleIcon className="size-4" />
                                                        <span className="sr-only">{t("actions.edit")}</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleBookmarkToggle(plan.id)}
                                                    className="h-8 w-8"
                                                >
                                                    <BookmarkSimpleIcon 
                                                        className="size-4" 
                                                        weight={bookmarkStatus.get(plan.id) ? "fill" : "regular"}
                                                    />
                                                    <span className="sr-only">
                                                        {bookmarkStatus.get(plan.id) ? t("actions.removeBookmark") : t("actions.bookmark")}
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleDeleteClick(plan.id, plan.title)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <TrashIcon className="size-4" />
                                                    <span className="sr-only">{t("actions.delete")}</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t("deleteDialog.description", { title: planToDelete?.title ?? "" })}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={!!deletingPlanId}>{t("deleteDialog.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDeleteConfirm();
                                    }}
                                    disabled={!!deletingPlanId}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    <MotionLoader pending={!!deletingPlanId} />
                                    {t("deleteDialog.confirm")}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground">
                            {t("pagination.showing", { start: startItem, end: endItem, total })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || isPending}
                            >
                                <CaretLeftIcon className="size-4" />
                                {t("pagination.previous")}
                            </Button>
                            <div className="text-sm font-medium">
                                {t("pagination.page", { current: currentPage, total: totalPages })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || isPending}
                            >
                                {t("pagination.next")}
                                <CaretRightIcon className="size-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}