import { Link, Subhead, Text } from "@vkontakte/vkui";
import { RichTooltip } from "@vkontakte/vkui/dist/components/RichTooltip/RichTooltip";
import { FC } from "react";

export const BetaInfoTooltip: FC = () => {

    return (
        <RichTooltip style={{ maxWidth: 320 }} content={
            <Subhead style={{ padding: '8px 12px', color: 'var(--vkui--color_text_primary)' }}>
                Расширение находится на стадии разработки.
                <br />
                Вся функциональность старой версии будет постепенно добавляться.
                <br /><br />
                С фидбеком, вопросами, пожеланиями — сюда <Link href="https://vk.me/vkaudiopad" target="_blank">https://vk.me/vkaudiopad</Link>.
                <br /><br />
                Спасибо за фидбек! ❤️
            </Subhead>
        }>
            <Text weight="2" style={{ cursor: "pointer" }}>β</Text>
        </RichTooltip>
    );
};
