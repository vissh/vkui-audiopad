import { useEffect, useRef } from "react";

type Timer = ReturnType<typeof setTimeout>;
type SomeFunction = (...args: any[]) => void;

export const useDebounce = <Func extends SomeFunction>(func: Func, delay: number) => {
    const timer = useRef<Timer>();

    useEffect(() => {
        return () => clearTimeout(timer.current);
    }, []);

    return ((...args) => {
        const newTimer = setTimeout(() => { func(...args) }, delay);
        clearTimeout(timer.current);
        timer.current = newTimer;
    }) as Func;
};
