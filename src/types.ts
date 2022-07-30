import {Dispatch, SetStateAction} from "react"

export type TypeSetState<T> = Dispatch<SetStateAction<T>>

export interface ITrackItem {
    id: string;
    image: string;
    artist: string;
    title: string;
    duration: number;
}

export interface ITrackItems {
    items: Array<ITrackItem>;
}

export interface SearchValue {
    value: string;
}

export interface IAddTracks {
    setTracks: TypeSetState<ITrackItems>
}
