import { Search } from "@vkontakte/vkui";
import { useOnLeaveSearchTab, useOnOpenSearchTab, useSetSearch } from "entities/navigation";
import { FC, useEffect, useRef, useState } from "react";
import { atom, useAtom } from "shared/lib/atom";
import { useDebounce } from "shared/lib/hooks";

const autoFocusAtom = atom(false);

export const SearchInput: FC = () => {
    const setSearch = useSetSearch();
    const [autoFocus, setAutoFocus] = useAtom(autoFocusAtom);

    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const setSearchValueToStorage = useDebounce((value: string) => {
        if (value) {
            setSearch(value);
        }
    }, 600);

    useOnOpenSearchTab((value) => setValue(value));

    useOnLeaveSearchTab(() => {
        setValue("");
        setAutoFocus(false);
    });

    useEffect(() => {
        autoFocus ? inputRef.current?.focus() : inputRef.current?.blur();
    }, [autoFocus]);

    return (
        <Search
            getRef={inputRef}
            value={value}
            onChange={(e: any) => {
                setAutoFocus(true);
                setValue(e.target.value);
                setSearchValueToStorage(e.target.value);
            }}
        />
    );
};
