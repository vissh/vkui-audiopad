import { Icon24ExternalLinkOutline, Icon56ErrorOutline, Icon56MusicOutline } from "@vkontakte/icons";
import { FormItem, Link, Panel, PanelSpinner, Placeholder, Textarea } from "@vkontakte/vkui";
import React, { FC } from "react";

type Props = {
    loading: boolean;
    hideLoader?: boolean;
    error: any | null;
    children: React.ReactNode;
};

export const Content: FC<Props> = ({ loading, hideLoader, error, children }) => {
    return (
        <>
            {children}
            {!loading && !children && !error && <EmptyResult />}
            {loading && !hideLoader && <Loading />}
            {error && <ErrorResult error={error} />}
        </>
    );
};

const Loading: FC = () => {
    return (
        <Panel>
            <PanelSpinner />
        </Panel>
    );
};

const EmptyResult: FC = () => {
    return (
        <Placeholder icon={<Icon56MusicOutline />}>
            По запросу не найдено ни одной аудиозаписи
        </Placeholder>
    );
};

type ErrorProps = {
    error: any;
};

const ErrorResult: FC<ErrorProps> = ({ error }) => {
    return (
        <Placeholder icon={<Icon56ErrorOutline />}>
            К сожалению, получение данных завершилось с ошибкой, повторите попытку позже.<br />
            Если ошибка не пропадает, отправьте сообщение в <Link href="https://vk.me/vkaudiopad" target="_blank">группу <Icon24ExternalLinkOutline width={16} height={16} /></Link>. Спасибо!<br />
            {error
                ? (
                    <FormItem top="Скопируйте информацию об ошибке">
                        <Textarea value={JSON.stringify(error)} />
                    </FormItem>
                )
                : null}
        </Placeholder>
    );
};
