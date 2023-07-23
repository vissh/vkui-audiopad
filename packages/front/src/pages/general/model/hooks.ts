import { useQuery } from "@tanstack/react-query";
import { fetchGeneral } from "../api/fetchers";

const queryName = "general";

export const useGeneralData = (userId: string) => {
    return useQuery({
        queryKey: [queryName],
        queryFn: () => fetchGeneral(userId),
        refetchOnWindowFocus: false,
        enabled: !!userId,
        retry: 2,
    });
};
