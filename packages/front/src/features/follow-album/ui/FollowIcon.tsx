import { Icon36Add, Icon36Done } from "@vkontakte/icons";
import { FC, useState } from "react";
import { TAlbum } from "shared/types";
import { vkApiFollow } from "../api/follow";

type FollowIconProps = {
    album: TAlbum;
};

export const FollowIcon: FC<FollowIconProps> = ({ album }) => {
    const [followed, setFollowed] = useState(album.isFollowed);

    const follow = async (e: any) => {
        e.stopPropagation();
        const followed = !!(await vkApiFollow(album));
        setFollowed(followed);
    };

    return (
        <>
            {!!album.followHash &&
                (followed ? (
                    <Icon36Done
                        className="vkap_cover_pl_act_btn"
                        onClick={follow}
                    />
                ) : (
                    <Icon36Add
                        className="vkap_cover_pl_act_btn"
                        onClick={follow}
                    />
                ))}
        </>
    );
};
