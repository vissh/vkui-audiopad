import { Headline } from "@vkontakte/vkui";
import { FC } from "react";

type DurationProps = {
    value: string;
};

export const Duration: FC<DurationProps> = ({ value }) => {
    return (
        <Headline
            level="1"
            style={{ color: "var(--vkui--color_text_secondary)" }}
        >
            {value}
        </Headline>
    );
};
