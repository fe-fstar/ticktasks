"use client";

import { useLinkStatus } from "next/link";
import MotionLoader from "./motion-loader";

export default function LinkLoader() {
    const { pending } = useLinkStatus();

    return (<MotionLoader pending={pending} />);
}