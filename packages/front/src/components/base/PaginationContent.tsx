import React, { FC, useEffect, useState } from "react";
import { filter, fromEvent } from "rxjs";
import { CONTENT_ELEMENT_ID } from "../../constants";
import { useAppDispatch } from "../../store/store";
import { TypeFetchError } from "../../store/types";
import { Content } from "./Content";

type Props = {
    loading: boolean;
    error: TypeFetchError | null;
    paginationFetcher: Function;
    needMore: Function;
    children: React.ReactNode;
};

export const PaginationContent: FC<Props> = ({ loading, error, paginationFetcher, needMore, children }) => {
    const dispatch = useAppDispatch();
    const [lock, setLock] = useState(false);

    useEffect(() => {
        if (!loading) {
            setLock(false);
            const contentElement = document.getElementById(CONTENT_ELEMENT_ID);
            const scrollHeight = window.innerHeight + 200;
            if (!lock
                && contentElement
                && (scrollHeight + window.scrollY >= contentElement.clientHeight)
                && needMore()) {

                setLock(true);
                dispatch(paginationFetcher())
            }
        }

        const contentElement = document.getElementById(CONTENT_ELEMENT_ID);
        const scrollHeight = window.innerHeight + 100;
        if (contentElement) {
            const subscription = fromEvent(document, "scroll")
                .pipe(filter(() => scrollHeight + window.scrollY >= contentElement.clientHeight))
                .subscribe(() => {
                    if (!lock && !loading && needMore()) {
                        setLock(true);
                        dispatch(paginationFetcher());
                    }
                });

            return () => { subscription.unsubscribe() };
        }

    }, [loading, lock]);

    return (
        <Content loading={loading} error={error}>
            {children}
        </Content>
    );
};
