import { useQuery } from "@tanstack/react-query";
import { fetchSearchTracks } from "../api/fetchers";

const queryName = "search";

export const useSearchData = (userId: string, value: string) => {
    return useQuery({
        queryKey: [queryName, userId, value],
        queryFn: () => fetchSearchTracks({ ownerId: userId, value: value }),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId && !!value,
        retry: 2,
    });
};
