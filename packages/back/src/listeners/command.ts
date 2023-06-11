import { nextTrack, previousTrack } from "../actions/next";
import { repeat } from "../actions/repeat";
import { applicationState } from "../state";
import { storage } from "../storage";

export const startListeningCommandEvents = () => {
    chrome.commands.onCommand.addListener(onCommand);
};

const onCommand = async (command: string) => {
    // При отображении в хроме, shortcut'ы сортируются по ключам, отсюда числа в начала команд.
    const commands = {
        "010-play-pause": async () => await storage.played.set(!applicationState.played),
        "020-previous": async () => await previousTrack(),
        "030-next": async () => await nextTrack(),
        "050-shuffle": async () => await storage.shuffle.set(!applicationState.shuffle),
        "060-loop": async () => await repeat(),
    };

    const handler = commands[command];
    handler && await handler();
};
