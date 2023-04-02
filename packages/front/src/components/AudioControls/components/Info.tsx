import { Icon24InfoCircleOutline } from "@vkontakte/icons";
import { WriteBarIcon } from "@vkontakte/vkui";
import { FC, useState } from "react";

export const Info: FC = () => {
    const [count, setCount] = useState<number | undefined>(undefined);

    return (
        <WriteBarIcon count={count} onClick={() => setCount((count || 0) + 1)}>
            <Icon24InfoCircleOutline />
        </WriteBarIcon>
    );
};

{/* <RichTooltip style={{ maxWidth: 320 }} content={
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
</RichTooltip > */}