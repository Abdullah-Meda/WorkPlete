chrome.runtime.onInstalled.addListener(() => {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlMatches: '.*' },
                    }),
                ],
                actions: [new chrome.declarativeContent.ShowAction()],
            },
        ]);
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'log') {
        console.log(message.obj);
    }
});
