import { Icon56LogoVk } from "@vkontakte/icons";
import { Button, Group, Link, Placeholder } from "@vkontakte/vkui";
import { FC } from "react";

export const Welcome: FC = () => {
    return (
        <Group>
            <Placeholder
                icon={<Icon56LogoVk />}
                header="Вход ВКонтакте"
                action={
                    <Link
                        href="https://vk.com/"
                        target="_blank"
                    >
                        <Button size="m">Перейти на сайт</Button>
                    </Link>
                }
            >
                Авторизуйтесь на сайте vk.com для использования расширения
            </Placeholder>
        </Group>
    );
};
