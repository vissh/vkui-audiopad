import { baseEnums } from "@vk-audiopad/common";
import { Icon28KeyboardOutline, Icon28MessageOutline, Icon28SettingsOutline } from '@vkontakte/icons';
import {
    Group,
    InfoRow,
    Link,
    ModalPage,
    ModalPageHeader,
    PanelHeaderClose,
    Platform,
    Select,
    SimpleCell,
    useAdaptivityConditionalRender,
    usePlatform
} from "@vkontakte/vkui";
import { useAtom } from "../../core/atom";
import { themeAtom } from "../../core/atoms/storage";

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
                <ThemeSetting />
                <FeedbackInfo />
            </Group>
        </ModalPage>
    );
};

const ShortсutInfo = () => {
    const isChrome = navigator.userAgent.match(/chrome|chromium|crios/i);
    const firefoxLink = "https://support.mozilla.org/ru/kb/menedzher-sochetaniya-klavish-dopolnenij-v-firefox";

    const description = (
        isChrome
            ? <span>Настройка горячих клавиш доступна по адресу <b>chrome://extensions/shortcuts</b></span>
            : <span>Инструкция по настройке горячих клавиш <Link href={firefoxLink} target="_blank">{firefoxLink}</Link>.</span>
    );

    return (
        <SimpleCell
            before={<Icon28KeyboardOutline />}
            hasHover={false}
            hasActive={false}
            multiline
        >
            {description}
        </SimpleCell>
    );
};

const ThemeSetting = () => {
    const [theme, setTheme] = useAtom(themeAtom);

    return (
        <SimpleCell
            before={<Icon28SettingsOutline />}
            hasHover={false}
            hasActive={false}
            multiline
        >
            <InfoRow header="Тема">
                <Select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as baseEnums.ETheme)}
                    options={[
                        { label: "Системная", value: baseEnums.ETheme.SYSTEM },
                        { label: "Светлая", value: baseEnums.ETheme.LIGHT },
                        { label: "Тёмная", value: baseEnums.ETheme.DARK },
                    ]}
                />
            </InfoRow>

        </SimpleCell>
    );
};

const FeedbackInfo = () => {
    return (
        <SimpleCell
            before={<Icon28MessageOutline />}
            hasHover={false}
            hasActive={false}
            multiline
        >
            С фидбеком, вопросами, пожеланиями — сюда <Link href="https://vk.me/vkaudiopad" target="_blank">https://vk.me/vkaudiopad</Link>.
        </SimpleCell>
    )
};
