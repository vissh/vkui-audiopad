import { Slider } from "@vkontakte/vkui";
import { useAtomValue } from "shared/lib/atom";
import { FC, useEffect, useState } from "react";
import { currentTimeAtom, durationAtom } from "shared/appAtoms";
import { actions } from "shared/lib/actions";
import { sendEventControlSlider } from "shared/lib/analytics";

const arrowKeyCodes = new Set(["ArrowLeft", "ArrowRight"]);

export const CurrentTimeSlider: FC = () => {
    const duration = useAtomValue(durationAtom);
    const currentTime = useAtomValue(currentTimeAtom);

    const [sliderCurrentTime, setSliderCurrentTime] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);

    const onMouseDown = (e: any) => {
        (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
        setMouseDown(true);
    };

    const onMouseUp = (e: any) => {
        (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
        actions.changeCurrentTime((sliderCurrentTime * duration) / 100);
        setMouseDown(false);
        sendEventControlSlider("currentTime");
    };

    useEffect(() => {
        if (!mouseDown) {
            const value = duration ? (currentTime * 100) / duration : 0;
            setSliderCurrentTime(value);
        }
    }, [currentTime, duration]);

    return (
        <Slider
            min={0}
            max={100}
            value={sliderCurrentTime}
            onChange={setSliderCurrentTime}
            onPointerDown={onMouseDown}
            onPointerUp={onMouseUp}
            onKeyDown={(e) => {
                if (!arrowKeyCodes.has(e.code)) {
                    return;
                }

                let value = (sliderCurrentTime * duration) / 100;
                value += e.code === "ArrowLeft" ? -1 : 1;
                actions.changeCurrentTime(value);
            }}
        />
    );
};
