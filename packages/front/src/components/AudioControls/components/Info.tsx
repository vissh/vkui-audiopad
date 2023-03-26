import { Icon24InfoCircleOutline } from '@vkontakte/icons';
import { IconButton } from '@vkontakte/vkui';
import { FC } from "react";

export const Info: FC = () => {

    return (
        // <RichTooltip style={{ maxWidth: 320 }} content={
        //     <Subhead style={{ padding: '8px 12px', color: 'var(--vkui--color_text_primary)' }}>
        //         Расширение находится на стадии разработки.
        //         <br />
        //         Вся функциональность старой версии будет постепенно добавляться.
        //         <br /><br />
        //         С фидбеком, вопросами, пожеланиями — сюда <Link href="https://vk.me/vkaudiopad" target="_blank">https://vk.me/vkaudiopad</Link>.
        //         <br /><br />
        //         Спасибо за фидбек! ❤️
        //     </Subhead>
        // }>
        //     <PanelHeaderButton>
        //         <Paragraph weight="1">β</Paragraph>
        //     </PanelHeaderButton>
        // </RichTooltip >
        <IconButton hasHover={false}>
            {<Icon24InfoCircleOutline />}
        </IconButton>
    );
};
