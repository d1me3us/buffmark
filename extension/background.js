const MENU_ID = "add-to-buffmark";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Bookmark with Buffmark",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) {
    return;
  }

  const dialogUrl = new URL(chrome.runtime.getURL("dialog.html"));
  dialogUrl.searchParams.set("text", info.selectionText);

  chrome.windows.create({
    url: dialogUrl.href,
    type: "popup",
    width: 520,
    height: 430,
    focused: true
  });
});
