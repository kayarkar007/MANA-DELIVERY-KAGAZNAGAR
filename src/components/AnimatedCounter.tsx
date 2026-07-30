"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
    target: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    className?: string;
}

export default function AnimatedCounter({
    target,
    suffix = "",
    prefix = "",
    duration = 2,
    className = "",
}: AnimatedCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

            // Ease out cubic for smooth deceleration
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easedProgress * target));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [isInView, target, duration]);

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {prefix}{count.toLocaleString("en-IN")}{suffix}
        </motion.span>
    );
}
