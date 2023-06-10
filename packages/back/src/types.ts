import { baseEnums, baseTypes } from "@vk-audiopad/common";

export type TListenedData = {
    userId: string;
    track: baseTypes.TTrackItem;
    listened: number;
    endStreamReason: baseEnums.EEndOfStreamReason;
};
