import { Icon56MusicOutline } from "@vkontakte/icons";
import { Placeholder } from "@vkontakte/vkui";
import { FC } from "react";

export const EmptyResult: FC = () => {
    return <Placeholder icon={<Icon56MusicOutline />}>По запросу не найдено ни одной аудиозаписи</Placeholder>;
};
