import { Icon24ExternalLinkOutline, Icon56ErrorOutline, Icon56MusicOutline } from "@vkontakte/icons";
import { FormItem, Group, Link, Panel, PanelSpinner, Placeholder, Textarea } from "@vkontakte/vkui";
import React, { FC } from "react";
import { serializeError } from "serialize-error";

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
    console.error(error);
    const link = <Link href="https://vk.me/vkaudiopad" target="_blank">группу <Icon24ExternalLinkOutline width={16} height={16} /></Link>

    return (
        <Group>
            <Placeholder icon={<Icon56ErrorOutline />}>
                К сожалению, получение данных завершилось с ошибкой, повторите попытку позже.<br />
                Если ошибка не пропадает, скопируйте данные и отправьте сообщение в {link}. Спасибо!<br />
                {error
                    ? <FormItem top="Скопируйте информацию об ошибке">
                        <Textarea value={JSON.stringify(serializeError(error))} />
                    </FormItem>
                    : null
                }
            </Placeholder>
        </Group>
    );
};
