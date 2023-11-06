import { baseEnums } from "@vk-audiopad/common";
import { setBadgeText } from "../utils";

export const onDurationMode = (mode: baseEnums.EDurationMode | undefined) => {
    setBadgeText(mode === undefined ? baseEnums.EDurationMode.TIME_PASSED : mode);
};
