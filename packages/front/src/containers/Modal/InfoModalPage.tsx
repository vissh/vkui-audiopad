import { baseEnums } from "@vk-audiopad/common";
import {
    Icon28KeyboardOutline,
    Icon28MessageOutline,
    Icon28SettingsOutline,
    Icon28ThumbsUpOutline,
    Icon28WrenchOutline,
} from '@vkontakte/icons';
import {
    Checkbox,
    FormItem,
    Group,
    InfoRow,
    Link,
    ModalPage,
    ModalPageHeader,
    PanelHeaderClose,
    Platform,
    Select,
    Separator,
    SimpleCell,
    useAdaptivityConditionalRender,
    usePlatform
} from "@vkontakte/vkui";
import { useAtom } from "../../core/atom";
import { hlsDebugAtom, themeAtom } from "../../core/atoms";

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
                <Rate />
                <Separator />
                <Debug />
            </Group>
        </ModalPage>
    );
};

const ShortсutInfo = () => {
    const isFirefoxExtension = location.href.startsWith("moz-extension://");
    const firefoxLink = "https://support.mozilla.org/ru/kb/menedzher-sochetaniya-klavish-dopolnenij-v-firefox";

    const description = (
        isFirefoxExtension
            ? <span>Инструкция по настройке горячих клавиш <Link href={firefoxLink} target="_blank">{firefoxLink}</Link>.</span>
            : <span>Настройка горячих клавиш доступна по адресу <b>chrome://extensions/shortcuts</b></span>
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
            С фидбеком, проблемами, вопросами, пожеланиями — сюда <Link href="https://vk.me/vkaudiopad" target="_blank">https://vk.me/vkaudiopad</Link>
        </SimpleCell>
    );
};

const Rate = () => {
    const isFirefoxExtension = location.href.startsWith("moz-extension://");
    const chromeLink = <Link href="https://chrome.google.com/webstore/detail/plclpmphdjmdgmdpfkcmdkmohgpfecip" target="_blank">https://chrome.google.com/</Link>;
    const firefoxLink = <Link href="https://addons.mozilla.org/ru/firefox/addon/vkaudiopad/" target="_blank">https://addons.mozilla.org/</Link>

    return (
        <SimpleCell
            before={<Icon28ThumbsUpOutline />}
            hasHover={false}
            hasActive={false}
            multiline
        >
            Буду благодарен за вашу оценку на странице расширения {isFirefoxExtension ? firefoxLink : chromeLink}
        </SimpleCell>
    );
};

const Debug = () => {
    const [hlsDebug, setHlsDebug] = useAtom(hlsDebugAtom);

    return (
        <SimpleCell
            before={<Icon28WrenchOutline />}
            hasHover={false}
            hasActive={false}
            multiline
        >
            <InfoRow header="Developer">
                <FormItem>
                    <Checkbox checked={hlsDebug} onChange={() => setHlsDebug(!hlsDebug)}>Debug mode</Checkbox>
                </FormItem>
            </InfoRow>
        </SimpleCell>
    );
};
