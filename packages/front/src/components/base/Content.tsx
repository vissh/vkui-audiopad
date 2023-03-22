import React, { FC } from "react";
import { TypeFetchError } from "../../store/types";
import { EmptyResult, ErrorResult, Loading } from "./blocks";

type Props = {
    loading: boolean;
    hideLoader?: boolean;
    error: TypeFetchError | null;
    children: React.ReactNode;
};

export const Content: FC<Props> = ({ loading, hideLoader, error, children }) => {
    return (
        <React.Fragment>
            {!loading && !children && !error && <EmptyResult />}
            {children}
            {loading && !hideLoader && <Loading />}
            {error && <ErrorResult error={error} />}
        </React.Fragment>
    );
};
