import { Icon20MessageOutline, Icon20WorkOutline, Icon24KeyboardOutline } from "@vkontakte/icons";
import { Group, Link, MiniInfoCell, ModalPage, ModalPageHeader, PanelHeaderClose, Platform, Separator, useAdaptivityConditionalRender, usePlatform } from "@vkontakte/vkui";

export const InfoModalPage = ({ ...props }) => {
    const platform = usePlatform();
    const { sizeX } = useAdaptivityConditionalRender();

    return (
        <ModalPage
            {...props}
            header={
                <ModalPageHeader
                    before={
                        sizeX.compact
                        && platform === Platform.ANDROID
                        && (
                            <PanelHeaderClose className={sizeX.compact.className} />
                        )
                    }
                >
                    Информация
                </ModalPageHeader>
            }
        >
            <Group>
                <ShortсutInfo />
                <Separator />
                <DevInfo />
                <FeedbackInfo />
            </Group>
        </ModalPage>
    );
};

const ShortсutInfo = () => {
    const isChrome = navigator.userAgent.match(/chrome|chromium|crios/i);
    const firefoxLink = "https://support.mozilla.org/ru/kb/menedzher-sochetaniya-klavish-dopolnenij-v-firefox";

    return (
        <MiniInfoCell before={<Icon24KeyboardOutline />} textWrap="full">
            {isChrome ? (
                <span>
                    Настройка горячих клавиш доступна по адресу <b>chrome://extensions/shortcuts</b>
                </span>
            ) : (
                <span>
                    Инструкция по настройке горячих клавиш <Link href={firefoxLink} target="_blank">{firefoxLink}</Link>.
                </span>
            )}
        </MiniInfoCell>
    );
};

const DevInfo = () => {
    return (
        <MiniInfoCell before={<Icon20WorkOutline />} textWrap="full">
            Расширение находится на стадии разработки.
            <br />
            Вся функциональность старой версии будет постепенно добавляться.
        </MiniInfoCell>
    );
};

const FeedbackInfo = () => {
    return (
        <MiniInfoCell before={<Icon20MessageOutline />} textWrap="full">
            С фидбеком, вопросами, пожеланиями — сюда <Link href="https://vk.me/vkaudiopad" target="_blank">https://vk.me/vkaudiopad</Link>.
        </MiniInfoCell>
    )
};