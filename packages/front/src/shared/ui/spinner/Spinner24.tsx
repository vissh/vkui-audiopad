import { Icon16Spinner, Icon24Spinner } from "@vkontakte/icons";
import { FC } from "react";

type Spinner24Props = {
    size?: "s" | "m";
    padding?: boolean;
};

export const Spinner24: FC<Spinner24Props> = ({ padding, size = "m" }) => {
    const SpinnerIcon = {
        s: Icon16Spinner,
        m: Icon24Spinner,
    }[size];

    const center = {
        s: 8,
        m: 12,
    }[size];

    return (
        <span className={"vkap_tooltip_icon_button" + (padding ? " vkap_tooltip_icon_button_padding" : "")}>
            <SpinnerIcon>
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from={`0 ${center} ${center}`}
                    to={`360 ${center} ${center}`}
                    dur="0.7s"
                    repeatCount="indefinite"
                />
            </SpinnerIcon>
        </span>
    );
};
