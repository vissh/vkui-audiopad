import { EPlaylistDataType } from "../types/enums";
import { getTextFromHtmlElements } from "../utils";
import { THtmlPlaylistBlock, THtmlPlaylistInfo } from "./types";

const trackDataTypes = new Set(["music_audios", "radiostations"]);
const playlistDataTypes = new Set(["music_playlists"]);
const allDataTypes = new Set([...trackDataTypes, ...playlistDataTypes]);

type BlockDataTypeElement = { blockId: string, dataType: EPlaylistDataType, blockElement: Element };

export const findPlaylistBlocks = (blockIds: string[], html: string): THtmlPlaylistBlock[] => {
    const htmlElement = document.createElement("html");
    htmlElement.innerHTML = html;

    return blockIds
        .reduce(toBlockDataTypeElement(htmlElement), [])
        .map(({ blockId, dataType, blockElement }) => ({
            blockId: blockId,
            title: findTitle(blockElement),
            dataType: dataType,
            showAllLink: findShowAllLink(blockElement),
            coverPlaylists: dataType === EPlaylistDataType.TRACKS ? [] : findCoverPlaylists(blockElement),
        }));
};

const toBlockDataTypeElement = (htmlElement: HTMLHtmlElement) => {
    return (result: BlockDataTypeElement[], blockId: string): BlockDataTypeElement[] => {
        const blockElement = htmlElement.querySelector(`[data-id=${blockId}]`);

        if (!blockElement) {
            return result;
        }

        const dataType = blockElement.getAttribute("data-type");
        if (!dataType || !allDataTypes.has(dataType)) {
            return result;
        }

        result.push({
            blockId: blockId,
            dataType: trackDataTypes.has(dataType) ? EPlaylistDataType.TRACKS : EPlaylistDataType.PLAYLISTS,
            blockElement: blockElement,
        });

        return result;
    };
};

const findTitle = (blockElement: Element): string => {
    const titleElements = blockElement.parentElement?.getElementsByClassName("CatalogBlock__title");
    return titleElements?.length ? titleElements[0].textContent || "" : "";
};

const findShowAllLink = (blockElement: Element): string => {
    const elements = blockElement.parentElement?.getElementsByClassName("audio_page_block__show_all_link");
    return elements?.length ? (elements[0].getAttribute("href") || "") : "";
};

const findCoverPlaylists = (blockElement: Element): THtmlPlaylistInfo[] => {
    return Array.from(blockElement.querySelectorAll("[data-id]"))
        .reduce((result: THtmlPlaylistInfo[], playlistElement: Element): THtmlPlaylistInfo[] => {
            const playlistId = playlistElement.getAttribute("data-id");

            if (!playlistId) {
                return result;
            }

            result.push({
                id: playlistId,
                subtitle: getTextFromHtmlElements(playlistElement.getElementsByClassName("audio_pl__year_subtitle"))
            });

            return result;

        }, []);
};
