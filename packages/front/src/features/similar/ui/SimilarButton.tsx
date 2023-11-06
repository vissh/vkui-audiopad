import { baseTypes } from "@vk-audiopad/common";
import { Icon20Stars, Icon24StarsOutline } from "@vkontakte/icons";
import { useSetPlaylistWithCleanHistory } from "entities/navigation";
import { snackbarAtom } from "entities/snackbar/model/atom";
import { SimilarTracksNotFound } from "entities/snackbar/ui/SimilarTracksNotFound";
import { FC, useState } from "react";
import { useSetAtom } from "shared/lib/atom";
import { Spinner24 } from "shared/ui/spinner/Spinner24";
import { TooltipIconButton } from "shared/ui/tooltip-icon-button";
import { fetchSimilarData } from "../api/similar";

type SimilarButtonProps = {
    userId: string;
    track: baseTypes.TTrackItem;
    size?: "s" | "m";
    padding?: boolean;
};

export const SimilarButton: FC<SimilarButtonProps> = ({ userId, track, size = "m", padding }) => {
    const setPlaylistWithCleanHistory = useSetPlaylistWithCleanHistory();
    const setSnackbar = useSetAtom(snackbarAtom);

    const [loading, setLoading] = useState(false);

    const onClick = async () => {
        setLoading(true);
        const playlist = await fetchSimilarData(userId, track);
        setLoading(false);

        if (!playlist) {
            setSnackbar(<SimilarTracksNotFound />);
            return;
        }

        setPlaylistWithCleanHistory(userId, playlist);
    };

    return (
        <>
            {loading ? (
                <Spinner24
                    size={size}
                    padding={padding}
                />
            ) : (
                <TooltipIconButton
                    padding={padding}
                    text="Показать похожие"
                    icon={{ s: Icon20Stars, m: Icon24StarsOutline }[size]}
                    onClick={onClick}
                />
            )}
        </>
    );
};
