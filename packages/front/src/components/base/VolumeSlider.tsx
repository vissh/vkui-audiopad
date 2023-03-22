import { storage } from "@vk-audiopad/common";
import { Slider } from "@vkontakte/vkui";
import { FC, useEffect, useState } from "react";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";

import { useTypedSelector } from "../../hooks/useTypedSelector";


export const VolumeSlider: FC = () => {
    const { volume } = useTypedSelector(state => state.application);

    const [tempValue, setVolume] = useState(100);
    const [volumeStream$] = useState(new Subject<number>());

    const onChangeVolume = (value: number) => {
        setVolume(value);
        volumeStream$.next(value);
    };

    useEffect(() => {
        setVolume(volume * 100);
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
        <Slider style={{ width: 100 }} min={0} max={100} value={tempValue} onChange={onChangeVolume} />
    );
};
