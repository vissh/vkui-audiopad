import { api } from "@vk-audiopad/common";
import { Slider } from "@vkontakte/vkui";
import { FC, useEffect, useState } from "react";
import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const CurrentTimeSlider: FC = () => {
    const { currentTime, duration } = useTypedSelector(state => state.application);

    const [sliderCurrentTime, setSliderCurrentTime] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);

    const onMouseDown = (e: any) => {
        (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
        setMouseDown(true);
    };

    const onMouseUp = async (e: any) => {
        (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
        await api.currentTime(sliderCurrentTime * duration / 100);
        setMouseDown(false);
    };

    useEffect(() => {
        if (!mouseDown) {
            const value = duration ? currentTime * 100 / duration : 0;
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
        />
    );
};
