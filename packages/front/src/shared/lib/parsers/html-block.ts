import { EPlaylistDataType } from "shared/types";
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
        .map(({ blockId, dataType, blockElement }) => {
            const parentElement = findParent(blockElement);
            return {
                blockId: blockId,
                title: parentElement ? findTitle(parentElement) : "",
                dataType: dataType,
                showAllLink: parentElement ? findShowAllLink(parentElement) : "",
                coverPlaylists: dataType === EPlaylistDataType.TRACKS ? [] : findCoverPlaylists(blockElement),
            }
        });
};

export const findSectionId = (html: string): string | null => {
    let sectionId = html.match(/"sectionId":\s?"(?<sectionId>[\w\-]+)"/)?.groups?.sectionId;
    if (!sectionId) {
        sectionId = html.match(/\\"sectionId\\":\s?\\"(?<sectionId>[\w\-]+)\\"/)?.groups?.sectionId;
    }
    return sectionId || null;
}

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
            dataType: trackDataTypes.has(dataType) ? EPlaylistDataType.TRACKS : EPlaylistDataType.ALBUMS,
            blockElement: blockElement,
        });

        return result;
    };
};

const findTitle = (element: Element): string => {
    const titleElements = element.getElementsByClassName("CatalogBlock__title");
    return titleElements.length > 0 ? titleElements[0].textContent || "" : "";
};

const findShowAllLink = (element: Element): string => {
    const elements = element.getElementsByClassName("audio_page_block__show_all_link");
    return elements.length > 0 ? (elements[0].getAttribute("href") || "") : "";

};

const findParent = (blockElement: Element): Element | null => {
    const parentElement = blockElement.parentElement;
    if (!parentElement) {
        return null;
    }

    if (parentElement.className.includes("CatalogBlock--divided")) {
        return parentElement;
    }

    const parentParentElement = parentElement.parentElement;
    if (!parentParentElement) {
        return null;
    }

    const index = Array.from(parentParentElement.children).indexOf(parentElement);
    if (index == -1) {
        return null;
    }

    return Array.from(parentParentElement.children)[index - 1];
}

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
