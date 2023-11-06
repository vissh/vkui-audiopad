import { UseMutationResult } from "@tanstack/react-query";
import { FC, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Content } from "../content";

type InfinityContentProps = {
    children: React.ReactNode;
    hasMore: boolean;
    loadMoreMutation: UseMutationResult<any, any, any>;
    loadMoreArgs?: any;
    error?: any;
};

export const InfinityContent: FC<InfinityContentProps> = ({
    children,
    hasMore,
    loadMoreMutation,
    loadMoreArgs,
    error,
}) => {
    const { ref, inView } = useInView({ skip: !hasMore });

    useEffect(() => {
        if (hasMore && inView && !loadMoreMutation.isLoading) {
            loadMoreMutation.mutate(loadMoreArgs);
        }
    }, [inView, hasMore, loadMoreMutation.isLoading]);

    return (
        <Content
            loading={loadMoreMutation.isLoading}
            error={error}
        >
            {children}
            {hasMore && <div ref={ref}></div>}
        </Content>
    );
};
