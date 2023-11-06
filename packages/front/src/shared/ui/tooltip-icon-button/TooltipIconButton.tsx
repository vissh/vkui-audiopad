import { TextTooltip } from "@vkontakte/vkui/dist/components/TextTooltip/TextTooltip";
import { FC } from "react";
import "./TooltipIconButton.css";

export type TooltipIconButtonProps = {
    text: string;
    icon: React.ComponentType<Partial<{ className: string; onClick: (e: any) => void }>>;
    accent?: boolean;
    padding?: boolean;
    onClick?: () => void;
};

export const TooltipIconButton: FC<TooltipIconButtonProps> = (props) => {
    const paddingClassName = props.padding ? "vkap_tooltip_icon_button_padding" : "";
    const accentClassName = props.accent ? "" : "vkap_tooltip_icon_button";

    return (
        <TextTooltip
            text={props.text}
            hideWhenReferenceHidden={true}
            arrowPadding={0}
            showDelay={500}
        >
            <props.icon
                className={`${accentClassName} ${paddingClassName}`}
                onClick={(e: any) => {
                    e.stopPropagation();
                    props.onClick && props.onClick();
                }}
            />
        </TextTooltip>
    );
};
