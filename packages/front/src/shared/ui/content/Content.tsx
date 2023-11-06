import { Icon24ExternalLinkOutline, Icon56ErrorOutline } from "@vkontakte/icons";
import { FormItem, Group, Link, Panel, PanelSpinner, Placeholder, Textarea } from "@vkontakte/vkui";
import React, { FC } from "react";
import { serializeError } from "serialize-error";

type ContentProps = {
    loading?: boolean;
    hideLoader?: boolean;
    error: any | null;
    children: React.ReactNode;
};

export const Content: FC<ContentProps> = ({ loading, hideLoader, error, children }) => {
    return (
        <>
            {children}
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

type ErrorProps = {
    error: any;
};

const ErrorResult: FC<ErrorProps> = ({ error }) => {
    console.error(error);
    const link = (
        <Link
            href="https://vk.me/vkaudiopad"
            target="_blank"
        >
            группу{" "}
            <Icon24ExternalLinkOutline
                width={16}
                height={16}
            />
        </Link>
    );

    return (
        <Group>
            <Placeholder icon={<Icon56ErrorOutline />}>
                К сожалению, получение данных завершилось с ошибкой, повторите попытку позже.
                <br />
                Если ошибка не пропадает, скопируйте данные и отправьте сообщение в {link}. Спасибо!
                <br />
                {error ? (
                    <FormItem top="Скопируйте информацию об ошибке">
                        <Textarea value={JSON.stringify(serializeError(error))} />
                    </FormItem>
                ) : null}
            </Placeholder>
        </Group>
    );
};
