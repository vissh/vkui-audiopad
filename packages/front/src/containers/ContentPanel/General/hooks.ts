import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "../../../core/atom";
import { mutationAtom } from "../../../core/atoms";
import { fetchGeneral } from "./fetchers";

const queryName = "general";

export const useGeneralData = (userId: string) => {
    const mutation = useAtomValue(mutationAtom);

    return useQuery({
        queryKey: [queryName, mutation],
        queryFn: () => fetchGeneral(userId),
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled: !!userId,
    });
};
