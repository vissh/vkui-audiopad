import { atom } from "../atom";
import { EModalPage } from "../types";

export const activeModalPageAtom = atom<EModalPage | null>(null);
