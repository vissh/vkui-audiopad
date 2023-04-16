import { storage } from "@vk-audiopad/common";
import { FormItem, Slider } from "@vkontakte/vkui";
import { FC, useEffect, useState } from "react";
import { Subject, debounceTime, distinctUntilChanged } from "rxjs";
import { useTypedSelector } from "../../../hooks/useTypedSelector";

export const Volume: FC = () => {
    const { volume } = useTypedSelector(state => state.application);

    const [sliderVolume, setSliderVolume] = useState(100);
    const [volumeStream$] = useState(new Subject<number>());

    const onChangeVolume = (value: number) => {
        setSliderVolume(value);
        volumeStream$.next(value);
    };

    useEffect(() => {
        setSliderVolume(volume * 100);
        const volumeSubsribtion = volumeStream$
            .pipe(
                debounceTime(10),
                distinctUntilChanged(),
            )
            .subscribe(async (value: number) => {
                await storage.volume.set(value / 100);
            });

        return () => { volumeSubsribtion.unsubscribe() }
    }, []);

    return (
        <FormItem style={{ padding: "14px 8px" }}>
            <Slider style={{ width: 60 }} min={0} max={100} value={sliderVolume} onChange={onChangeVolume} />
        </FormItem>
    );
};
