import { FormItem, Slider } from "@vkontakte/vkui";
import { FC, useEffect, useState } from "react";
import { useAtom } from "../../../core/atom";
import { volumeAtom } from "../../../core/atoms";
import { useDebounce } from "../../../core/hooks/debounce";

const delayMs = 50;

export const VolumeSlider: FC = () => {
    const [volume, setVolume] = useAtom(volumeAtom);
    const [sliderVolume, setSliderVolume] = useState(100);

    useEffect(() => {
        setSliderVolume(volume * 100);
    }, [volume]);

    const setVolumeToStorage = useDebounce((value: number) => setVolume(value), delayMs);

    const onChange = (value: number) => {
        setSliderVolume(value);
        setVolumeToStorage(value / 100);
    };

    return (
        <FormItem style={{ padding: "14px 8px" }}>
            <Slider
                style={{ width: 100 }}
                min={0}
                max={100}
                value={sliderVolume}
                onChange={onChange} />
        </FormItem>
    );
};
