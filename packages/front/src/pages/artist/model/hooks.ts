import { useQuery } from "@tanstack/react-query";
import { fetchArtistData } from "../api/fetchers";

const queryName = "artist";

export const useArtistData = (userId: string, artistId: string) => {
    return useQuery({
        queryKey: [queryName, userId, artistId],
        queryFn: () => fetchArtistData(artistId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId && !!artistId,
        retry: 2,
    });
};
